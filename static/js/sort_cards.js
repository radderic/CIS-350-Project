"use strict";
//all cards
var collection;
var sealedresult = [];
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
    for(var card in collection) {
        if(card !== "count") {
            let count = collection[card].count;
            for(var i = 0; i < count; i++) {
                if(collection[card].rarity === "Common"){
                    commons.push(card);
                }else if(collection[card].rarity === "Uncommon"){
                    uncommons.push(card);
                }else if(collection[card].rarity === "Rare"){
                    rares.push(card);
                }else if(collection[card].rarity === "Mythic"){
                    mythics.push(card);
                }
                //else invalid rarity - add warning here in second release?
            }
        }
    }
}

/**
 * Function: add_buttons
 * Populates the controls div of sealed.html with buttons embedded with javascript functions
 */
function add_buttons(){
    $(".controls").append(`
    <button onclick="sort_cards:simulate_sealed()">Simulate Sealed</button>
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
    if(deckLength > 0) {
        for(let id in deck) {
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
    data : {
        fetch : "fetch"
    },
    type : "POST",
    url: "/fetch"
})
.done(function(data) {
    if(data.error) {
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
 * Displays the sealedresult and deck displays on the webpage
 */
function display_cards() {
    //clear current display
    $("#sealed-results").text("");
    $("#sealed-picks").text("");
    //re-sort lists
    sealedresult.sort();
    //display each element in sealedresult
    for(var index in sealedresult) {
        let card_id = sealedresult[index];
        let card_img = collection[card_id].image_url;
        let name = collection[card_id].card_name;
        $("#sealed-results").append(`<div class="sealed-card" id="${card_id}">
                <img onclick="sort_cards:add_to_deck(${card_id})" src=${card_img} alt=${name}/>
            </div>`);
    }
    //display each card in deck
    for(var key in deck){
        let card_id = key;
        let count = deck[key];
        let name = collection[card_id].card_name;
        $("#sealed-picks").append(`<div class="deck-card" id="${card_id}">
                <p onclick="sort_cards:remove_from_deck(${card_id})">${count}x ${name} </p>
            </div>`);
    }
}

/**
 * Function: simulate_sealed
 * Generates a pool of cards for the sealedresult from the collection
 */
function simulate_sealed () {
    //numbers of each rarity opened in a sealed draft - rares and mythics subject to change
    var numCommons = 60;
    var numUncommons = 18;
    var numRares = 6;
    //workaround for javascript not supporting pass by val for arrays
    var tempCommons = commons.slice();
    var tempUncommons = uncommons.slice();
    var tempRares = rares.slice();
    var tempMythics = mythics.slice();
    //clear existing deck/sealeresults if any
    sealedresult = [];
    deck = {};

    //numMythics compared against "magic number" 6 because it's the max possible mythics
    if(tempCommons.length >= numCommons && uncommons.length >= numUncommons &&
        (rares.length + mythics.length) >= numRares){

        //select 60 random commons
        for(let i = 0; i < numCommons; i++){
            //select an index
            let tempIndex = Math.floor(Math.random() * tempCommons.length);
            //add card to sealedresult
            sealedresult.push(tempCommons[tempIndex]);
            //remove card from rarity array to avoid double-drafting it
            tempCommons.splice(tempIndex,1);
        }
        //select 18 random uncommons
        for(let i = 0; i < numUncommons; i++){
            let tempIndex = Math.floor(Math.random() * tempUncommons.length);
            sealedresult.push(tempUncommons[tempIndex]);
            tempUncommons.splice(tempIndex,1);
        }
        //select up to 6 random rares, with a 12.5% chance on each to be replaced by a mythic
        for(let i = 0; i < numRares; i++){
            //check for a random chance to upgrade otherwise it remains a rare
            let mythic = Math.floor(Math.random() * 1000);
            //"magic number" 124 derived from 12.5% chance for a rare to become a mythic
            if (mythic <= 124){
                if(tempMythics.length > 0) {
                    let tempIndex = Math.floor(Math.random() * tempMythics.length);
                    sealedresult.push(tempMythics[tempIndex]);
                    tempMythics.splice(tempIndex,1);
                }
                //else we have no mythic, substitute a rare
                else {
                    let tempIndex = Math.floor(Math.random() * tempRares.length);
                    sealedresult.push(tempRares[tempIndex]);
                    tempRares.splice(tempIndex, 1);
                }
            }
            else if(tempRares.length > 0) {
                let tempIndex = Math.floor(Math.random() * tempRares.length);
                sealedresult.push(tempRares[tempIndex]);
                tempRares.splice(tempIndex,1);
            }
            // we must have run out of rares, use mythics
            else{
                let tempIndex = Math.floor(Math.random() * tempMythics.length);
                sealedresult.push(tempMythics[tempIndex]);
                tempMythics.splice(tempIndex,1);
            }
        }
        display_cards();
    }
    //else collection needs more cards TODO print warning to user
}

/**
 * Function: add_to_deck
 * Takes a card with the given card_id, removes it from sealedresult, and adds it to the deck
 * @param {*} card_id the identifier code of the card to be moved from sealedresult to deck
 */
function add_to_deck(card_id){
    //if card is already in deck, increase its count
    if(card_id in deck){
        deck[card_id] += 1;
    }
    /*else, add it as a new keyval pair where the key is the ID 
    and the value is the count (starting at one)*/
    else{
        deck[card_id] = 1;
    }
    //remove the card from sealedresult
    for(var index in sealedresult){
        if(sealedresult[index] == card_id){
            sealedresult.splice(index,1);
            break;
        }
    }
    update_export();
    display_cards();
}

/**
 * Function: remove_from_deck
 * Takes a card with the given card_id, removes it from the deck, and adds it to sealedresult
 * @param {*} card_id the identifier code of the card to be moved from the deck to sealedresult
 */
function remove_from_deck(card_id){
    let count = deck[card_id];
    sealedresult.push(card_id);
    //Remove from deck if one or less (meaning 0 after the card is removed)
    if(count <= 1){
        delete deck[card_id];
    } 
    //else decrement count by one
    else {
        deck[card_id] = count - 1;
    }
    update_export();
    display_cards();
}

function clear_deck(){
    for(var card_id in deck){
        let count = deck[card_id];
        for(let i = 0; i < count; i++){
            sealedresult.push(card_id);
        }
        delete deck[card_id];
    }
    update_export();
    display_cards();
}
