"use strict";
//all cards
var collection;
var packarray = [];
var draftresult = [];
var deck = {};

var commons = [];
var uncommons = [];
var rares = [];
var mythics = [];

/**
 * Function: Sort Rarity
 * Takes the entire collection (draft pool of cards) and breaks it down into arrays by rarity.
 *
 * @param {*} collection The array of cards to be included in the draft pool
 */
function sort_rarity(collection) {
    for (var card in collection) {
        if (card !== "count") {
            let count = collection[card].count;
            for (var i = 0; i < count; i++) {
                if (collection[card].rarity === "Common") {
                    commons.push(card);
                } else if (collection[card].rarity === "Uncommon") {
                    uncommons.push(card);
                } else if (collection[card].rarity === "Rare") {
                    rares.push(card);
                } else if (collection[card].rarity === "Mythic") {
                    mythics.push(card);
                }
            }
        }
    }
}

/**
 * Function: add_buttons
 * Populates the controls div of draft.html with buttons embedded with javascript functions
 */
function add_buttons() {
    $(".controls").append(`
    <button onclick="sort_cards:simulate_draft()">Simulate Draft</button>
    <button  onclick="sort_cards:clear_deck()">Clear Deck</button>
    `);
}

/**
 * Function: update_export
 * Updates the value to be used by the export button
 */
function update_export() {
    let deckJson = {};
    let deckLength = Object.keys(deck).length;
    if (deckLength > 0) {
        for (let id in deck) {
            deckJson[id] = collection[id];
            deckJson[id]["count"] = deck[id];
        }
    }
    let base64_deck = btoa(JSON.stringify(deckJson, null, 1));
    $("#export").attr("href", "data:application/octet-stream;charset=utf-16le;base64," + base64_deck);
}

/**
 * Function: $.ajax
 * Parses the json collection and stores it as an instance variable, then executes startup functions: sort_rarity, add_buttons, and update_export
 */
$.ajax({
    data: {
        fetch: "fetch"
    },
    type: "POST",
    url: "/fetch"
})
    .done(function (data) {
        if (data.error) {
            console.log(data.error);
        }
        else {
            collection = JSON.parse(data.success);
            sort_rarity(collection);
            add_buttons();
            update_export();
        }
    });

/**
 * Function: display_cards
 * Displays the draftresult and deck displays on the webpage
 */
function display_cards() {
    //clear current display
    $("#sealed-results").text("");
    $("#sealed-picks").text("");
    //re-sort lists
    draftresult.sort();
    //display each element in draftresult
    for (var index in draftresult) {
        let card_id = draftresult[index];
        let card_img = collection[card_id].image_url;
        let name = collection[card_id].card_name;
        $("#sealed-results").append(`<div class="sealed-card" id="${card_id}">
                <img onclick="sort_cards:add_to_deck(${card_id})" src=${card_img} alt=${name}/>
            </div>`);
    }
    //display each card in deck
    for (var key in deck) {
        let card_id = key;
        let count = deck[key];
        let name = collection[card_id].card_name;
        $("#sealed-picks").append(`<div class="deck-card" id="${card_id}">
                <p onclick="sort_cards:remove_from_deck(${card_id})">${count}x ${name} </p>
            </div>`);
    }
}

/**
 * Function: simulate_draft
 * TODO
 */
function simulate_draft() {
    //numbers of each rarity opened in a draft - rares and mythics subject to change
    var numCommons = 240;
    var numUncommons = 72;
    var numRares = 24;
    //clear existing deck/draftresults if any
    draftresult = [];
    deck = {};

    //numMythics compared against "magic number" 24 because it's the max possible mythics
    if (commons.length >= numCommons && uncommons.length >= numUncommons &&
        (rares.length + mythics.length) >= numRares) {

        //generate and store 24 packs in packarray
        generate_packs();
        //8 packs for rotation one,  packs total
        packrotation(0);
        packrotation(8);
        packrotation(16);
        //display pack 0, remove a card from packs 1-7
        //remove card from pack, and add card to draftresults
        //display pack 1, remove cards from 0 and 2-7...
        //repeat x14
        //rotation 2
        //display pack 8, remove a card from packs 9-15...
        //rotation 3
        //switch modes
        //hide draft and spoiler divs
        //show new divs and buttons
    }
    //else collection needs more cards TODO print warning to user
}

/**
 * TODO
 */
function generate_packs() {
    packarray = [];
    
    //workaround for javascript not supporting pass by val for arrays
    let tempCommons = commons.slice();
    let tempUncommons = uncommons.slice();
    let tempRares = rares.slice();
    let tempMythics = mythics.slice();

    //generate packs
    for (let i = 0; i < 24; i++) {
        let temppack = [];

        //add commons to temppack
        for (let i = 0; i < 10; i++) {
            //select an index
            let tempIndex = Math.floor(Math.random() * tempCommons.length);
            //add card to temppack
            temppack.push(tempCommons[tempIndex]);
            //remove card from rarity array to avoid double-drafting it
            tempCommons.splice(tempIndex, 1);
        }

        //select 3 random uncommons
        for (let i = 0; i < 3; i++) {
            let tempIndex = Math.floor(Math.random() * tempUncommons.length);
            temppack.push(tempUncommons[tempIndex]);
            tempUncommons.splice(tempIndex, 1);
        }
        //select a random rares, with a 12.5% chance  to be replaced by a mythic
        for (let i = 0; i < 1; i++) {
            //check for a random chance to upgrade otherwise it remains a rare
            let mythic = Math.floor(Math.random() * 1000);
            //"magic number" 124 derived from 12.5% chance for a rare to become a mythic
            if (mythic <= 124) {
                if (tempMythics.length > 0) {
                    let tempIndex = Math.floor(Math.random() * tempMythics.length);
                    temppack.push(tempMythics[tempIndex]);
                    tempMythics.splice(tempIndex, 1);
                }
            }
            else if (tempRares.length > 0) {
                let tempIndex = Math.floor(Math.random() * tempRares.length);
                temppack.push(tempRares[tempIndex]);
                tempRares.splice(tempIndex, 1);
            }
            // we must have run out of rares, use mythics
            else {
                let tempIndex = Math.floor(Math.random() * tempMythics.length);
                temppack.push(tempMythics[tempIndex]);
                tempMythics.splice(tempIndex, 1);
            }
        }
        packarray.push(temppack);
    }
}

/**
 * TODO
 * @param {} startindex 
 */
function packrotation(startindex) {
    for (let i = 0; i < 14; i++) {
        let currentpack = (i % 8) + startindex;
        //choose pack to display
        display_pack(packarray(currentpack));
        //remove a card from the other packs
        for (let j = 0; j < 8; j++) {
            //if not the current pack, remove random card (bot draft)
            if (startindex + j != currentpack) {
                discard_from_pack(packarray(startindex + j));
            }
        }

        //TODO pause until user selects a card
    }

}

//TODO display pack
/**
 * Function: display_pack
 * Displays the sealedresult and deck displays on the webpage
 */
function display_pack(temppack) {
    //clear current display
    $("#sealed-results").text("");
    //re-sort lists
    temppack.sort();
    //display each element in sealedresult
    for (var index in temppack) {
        let card_id = temppack[index];
        let card_img = collection[card_id].image_url;
        let name = collection[card_id].card_name;
        $("#sealed-results").append(`<div class="sealed-card" id="${card_id}">
                <img onclick="draft_cards:choose_from_pack(${card_id}, ${temppack})" src=${card_img} alt=${name}/>
            </div>`);
    }
}

//TODO choose from pack
function choose_from_pack(card_id, temppack) {
    //if card is already in deck, increase its count
    if (card_id in deck) {
        deck[card_id] += 1;
    }
    /*else, add it as a new keyval pair where the key is the ID 
    and the value is the count (starting at one)*/
    else {
        deck[card_id] = 1;
    }
    //remove the card from draftresult
    for (var index in temppack) {
        if (temppack[index] == card_id) {
            temppack.splice(index, 1);
            break;
        }
    }
    update_export();
    display_pack(temppack);
}

//TODO discard from pack
/**
 * Function: discard_from_pack
 * Chooses a random card in the pack and removes it
 * @param {*} temppack the pack from packarray which is to be removed
 */
function discard_from_pack(temppack) {
    let tempIndex = Math.floor(Math.random() * temppack.length);
    temppack.splice(tempIndex, 1);
}

/**
 * Function: add_to_deck
 * Takes a card with the given card_id, removes it from draftresult, and adds it to the deck
 * @param {*} card_id the identifier code of the card to be moved from draftresult to deck
 */
function add_to_deck(card_id) {
    //if card is already in deck, increase its count
    if (card_id in deck) {
        deck[card_id] += 1;
    }
    /*else, add it as a new keyval pair where the key is the ID 
    and the value is the count (starting at one)*/
    else {
        deck[card_id] = 1;
    }
    //remove the card from draftresult
    for (var index in draftresult) {
        if (draftresult[index] == card_id) {
            draftresult.splice(index, 1);
            break;
        }
    }
    update_export();
    display_cards();
}

/**
 * Function: remove_from_deck
 * Takes a card with the given card_id, removes it from the deck, and adds it to draftresult
 * @param {*} card_id the identifier code of the card to be moved from the deck to draftresult
 */
function remove_from_deck(card_id) {
    let count = deck[card_id];
    draftresult.push(card_id);
    //Remove from deck if one or less (meaning 0 after the card is removed)
    if (count <= 1) {
        delete deck[card_id];
    }
    //else decrement count by one
    else {
        deck[card_id] = count - 1;
    }
    update_export();
    display_cards();
}

/**
 * TODO
 */
function clear_deck() {
    for (var card_id in deck) {
        let count = deck[card_id];
        for (let i = 0; i < count; i++) {
            draftresult.push(card_id);
        }
        delete deck[card_id];
    }
    update_export();
    display_cards();
}
