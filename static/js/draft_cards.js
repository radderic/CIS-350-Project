"use strict";
//all cards
var collection;
//stores the 24 packs used during the draft process
var packarray = [];
//contains the cards the user puts into their sideboard after the draft
var draftresult = [];
//contains cards the user chose during their draft (and haven't moved to the sideboard)
var deck = {};

var commons = [];
var uncommons = [];
var rares = [];
var mythics = [];


//numbers of each rarity opened in a draft - rares and mythics are stored together
var numCommons = 240;
var numUncommons = 72;
var numRares = 24;

//Tracks how far into the draft a user is
var picknumber = 0;

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
    <button onclick="sort_cards:simulate_draft()">Reset Draft</button>
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
    deckJson["count"] = 0;
    if (deckLength > 0) {
        for (let id in deck) {
            deckJson[id] = collection[id];
            deckJson[id]["count"] = deck[id];
            deckJson["count"] += deckJson[id]["count"];
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
 * Function: display_deck
 * Shows the card names/counts of cards the user has selected during the draft in a deck spoiler
 */
function display_deck() {
    //clear current display
    $("#draft-picks").text("");
    //display each card in deck
    for (var key in deck) {
        let card_id = key;
        let count = deck[key];
        let name = collection[card_id].card_name;
        $("#draft-picks").append(`<div class="deck-card" id="${card_id}">
                <p onclick="sort_cards:remove_from_deck(${card_id})">${count}x ${name} </p>
            </div>`);
    }
}

/**
 * Function: display_sideboard
 * Shows cards the user has removed from their deck post-draft in the main area as images
 */
function display_sideboard() {
    //clear current display
    $("#draft-results").text("");
    //re-sort list
    draftresult.sort();
    //display each element in draftresult
    for (var index in draftresult) {
        let card_id = draftresult[index];
        let card_img = collection[card_id].image_url;
        let name = collection[card_id].card_name;
        $("#draft-results").append(`<div class="draft-card" id="${card_id}">
            <img onclick="sort_cards:add_to_deck(${card_id})" src=${card_img} alt=${name}/>
            </div>`);
    }
}

/**
 * Function: display_cards
 * Displays the draftresult (sideboard) and deck to the webpage
 */
function display_cards() {
    display_deck();
    display_sideboard();
}

/**
 * Function: display_pack
 * Displays the current pack of cards to the user and allows them to select one
 */
function display_pack(temppack) {
    //clear current display
    $("#draft-results").text("");
    //display each element in sealedresult
    for (var index in temppack) {
        let card_id = temppack[index];
        let card_img = collection[card_id].image_url;
        let name = collection[card_id].card_name;
        $("#draft-results").append(`<div class="draft-card" id="${card_id}">
                <img onclick="draft_cards:choose_from_pack(${card_id}, ${temppack})" src=${card_img} alt=${name}/>
            </div>`);
    }
}

/**
 * Function: generate_packs
 * Creates 24 packs of cards from the users collection to be used
 * in the draft process. Each pack contains 10 commons, 3 uncommons,
 * and either one rare or one mythic rare card.
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
                //else we have no mythic, substitute a rare
                else {
                    let tempIndex = Math.floor(Math.random() * tempRares.length);
                    temppack.push(tempRares[tempIndex]);
                    tempRares.splice(tempIndex, 1);
                }
            }
            //else if we didn't roll a mythic and have rares remaining
            else if (tempRares.length > 0) {
                let tempIndex = Math.floor(Math.random() * tempRares.length);
                temppack.push(tempRares[tempIndex]);
                tempRares.splice(tempIndex, 1);
            }
            // else we didn't roll a mythic, but are substituting one in because we're out of rares
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
 * Function: discard_from_pack
 * Chooses a random card in a pack (passed into the function) and removes it
 * @param {*} temppack the pack from packarray which is to be removed
 */
function discard_from_pack(temppack) {
    let tempIndex = Math.floor(Math.random() * temppack.length);
    temppack.splice(tempIndex, 1);
}

/**
 * Function: choose_from_pack
 * Adds a card to the user's draft deck from a pack, simulates players drafting
 * cards from the other packs in the rotation, then increments the picknumber
 *
 * @param {*} card_id
 */
function choose_from_pack(card_id) {
    let startindex = 0;
    //determine which rotation of the draft is active
    if (picknumber > 27) {
        startindex = 16;
    }
    else if (picknumber > 13) {
        startindex = 8;
    }
    //else startindex = 0;

    //derive which pack the user must be on from the picknumber
    let currentpack = ((picknumber % 14) % 8) + startindex;
    let temppack = packarray[currentpack];

    //if card is already in deck, increase its count
    if (card_id in deck) {
        deck[card_id] += 1;
    }
    /* else, add it as a new key-val pair where the key is the ID
    and the value is the count (starting at one) */
    else {
        deck[card_id] = 1;
    }

    //update deck display
    display_deck();
    update_export();

    //remove the card from the pack
    for (var index in temppack) {
        if (temppack[index] == card_id) {
            temppack.splice(index, 1);
            break;
        }
    }

    //remove a card from the other packs in that rotation
    for (let j = 0; j < 8; j++) {
        //if not the current pack, remove random card (bot draft)
        if (startindex + j != currentpack) {
            discard_from_pack(packarray[startindex + j]);
        }
    }

    //Increase the counter for number of picks taken in the draft, update rotation if needed
    picknumber++;
    //determine which rotation of the draft is active
    if (picknumber > 27) {
        startindex = 16;
    }
    else if (picknumber > 13) {
        startindex = 8;
    }
    //else startindex = 0;

    //Decide if draft is finished or if another pack should be displayed
    if (picknumber > 41) {
        //end drafting mode, display updated deck and sideboard
        $("#draft-progress").text("Sideboard | Draft complete");
        display_cards();
    }
    else {
        currentpack = ((picknumber % 14) % 8) + startindex;
        temppack = packarray[currentpack];
        //update text for the user
        $("#draft-progress").text("Pick: " + (picknumber + 1) + " | Pack " + (currentpack + 1) + " | Rotation: " + Math.floor((currentpack / 8) + 1));
        //display next pack in the rotation
        display_pack(temppack);
    }
}

/**
 * Function: simulate_draft
 * Verifies the user's collection is large enough for a draft. If it is, generates
 * 24 packs of cards from their collection, and begins a fresh draft
 */
function simulate_draft() {

    //numMythics compared against "magic number" 24 because it's the max possible mythics
    if (commons.length >= numCommons && uncommons.length >= numUncommons &&
        (rares.length + mythics.length) >= numRares) {
        //reset draft state
        packarray = [];
        draftresult = [];
        deck = {};
        picknumber = 0;
        $("#draft-results").text("");
        $("#draft-picks").text("");
        $("#draft-progress").text("Pick: 1 | Pack 1 | Rotation: 1");

        //generate and store 24 packs in packarray
        generate_packs();
        /* display first pack to the user, which allows them to drive the
        remainder of the draft */
        display_pack(packarray[0]);
    }
    //else collection needs more cards
    else{
       $("#draft-results").text("Insufficient cards in your collection. Needs: 240 Commons, 72 Uncommons, 24 Rares/Mythics.");
    }
}

/**
 * Function: add_to_deck
 * Takes a card with the given card_id, removes it from draft sideboard, and adds it to the deck
 * @param {*} card_id the identifier code of the card to be moved from the sideboard to deck
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
 * Takes a card with the given card_id, removes it from the deck, and adds it to the sideboard
 * if the game state is still in drafting mode (picknumber < 42), this function does nothing
 * @param {*} card_id the identifier code of the card to be moved from the deck to the sideboard
 */
function remove_from_deck(card_id) {
    if (picknumber > 41) {
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
    //else draft still in progress, cannot remove cards from deck
}

/**
 * Function: clear deck
 * Moves all cards in the deck to the sideboard. Can only be used once the drafting
 * phase is completed
 */
function clear_deck() {
    if (picknumber > 41) {
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
    //else tried to clear the deck during a draft
}