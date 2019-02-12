//all cards
var collection;
var sealedresult = [];
var deck = [];

var commons = [];
var uncommons = [];
var rares = [];
var mythics = [];

$.ajax({
    data : {
        fetch : "fetch"
    },
    type : 'POST',
    url: '/fetch'
})
.done(function(data) {
    if(data.error) {
        console.log(data.error);
    }
    else {
        collection = JSON.parse(data.success);
        sortRarity(collection);
        simulateSealed(commons, uncommons, rares, mythics);
        display_cards();
    }
});

function sortRarity(collection) {
    for(var card in collection) {
        if(card !== 'count') {
            let count = collection[card].count;
            for(var i = 0; i < count; i++) {
                if(collection[card].rarity === 'Common'){
                    commons.push(card);
                }else if(collection[card].rarity === 'Uncommon'){
                    uncommons.push(card);
                }else if(collection[card].rarity === 'Rare'){
                    rares.push(card);
                }else if(collection[card].rarity === 'Mythic'){
                    mythics.push(card);
                }
                //else invalid rarity - add warning here in second release?
            }
        }
    }
}

function simulateSealed (commons, uncommons, rares, mythics) {
    //numbers of each rarity opened in a sealed draft - rares and mythics subject to change
    var numCommons = 60;
    var numUncommons = 18;
    var numRares = 6;

    //numMythics compared against "magic number" 6 because it's the max possible mythics
    if(commons.length >= numCommons && uncommons.length >= numUncommons &&
        (rares.length + mythics.length) >= numRares){

        //select 60 random commons
        for(let i = 0; i < numCommons; i++){
            //select an index
            let tempIndex = Math.floor(Math.random() * commons.length);
            //add card to sealedresult
            sealedresult.push(commons[tempIndex]);
            //remove card from rarity array to avoid double-drafting it
            commons.splice(tempIndex,1);
        }
        //select 18 random uncommons
        for(let i = 0; i < numUncommons; i++){
            let tempIndex = Math.floor(Math.random() * uncommons.length);
            sealedresult.push(uncommons[tempIndex]);
            uncommons.splice(tempIndex,1);
        }
        //select up to 6 random rares, with a 12.5% chance on each to be replaced by a mythic
        for(let i = 0; i < numRares; i++){
            //check for a random chance to upgrade otherwise it remains a rare
            let mythic = Math.floor(Math.random() * 1000);
            //"magic number" 124 derived from 12.5% chance for a rare to become a mythic
            if (mythic <= 124){
                if(mythics.length > 0) {
                    let tempIndex = Math.floor(Math.random() * mythics.length);
                    sealedresult.push(mythics[tempIndex]);
                    mythics.splice(tempIndex,1);
                }
            }
            else if(rares.length > 0) {
                let tempIndex = Math.floor(Math.random() * rares.length);
                sealedresult.push(rares[tempIndex]);
                rares.splice(tempIndex,1);
            }
            // we must have run out of rares, use mythics
            else{
                let tempIndex = Math.floor(Math.random() * mythics.length);
                sealedresult.push(mythics[tempIndex]);
                mythics.splice(tempIndex,1);
            }
        }
    }else{
        //TODO print warning to user
    }
}

function display_cards() {
    //clear current display
    $("#sealed-results").text("");
    $("#sealed-picks").text("");
    //resort lists
    sealedresult.sort();
    deck.sort();
    //display each element in sealedresult
    for(var index in sealedresult) {
        let card_id = sealedresult[index];
        let card_img = collection[card_id]['image_url'];
        let name = collection[card_id]['card_name'];
        $("#sealed-results").append(`<div class="sealed-card" id="${card_id}">
                <img onclick="sort_cards:add_to_deck(${card_id})" src=${card_img} alt=${name}/>
            </div>`);
    }
    //display each card in deck
    for(var index in deck){
        let card_id = deck[index];
        let card_img = collection[card_id]['image_url'];
        let name = collection[card_id]['card_name'];
        $("#sealed-picks").append(`<div class="deck-card" id="${card_id}">
                <p onclick="sort_cards:remove_card(${card_id})">${name}</p>
            </div>`);
    }
}

function add_to_deck(card_id){
    for(var index in sealedresult){
        if(sealedresult[index] == card_id){
            deck.push(card_id);
            sealedresult.splice(index,1);
            break;
        }
    }
    display_cards();
}

function remove_card(card_id){
    for(var index in deck){
        if(deck[index] == card_id){
            sealedresult.push(card_id);
            deck.splice(index,1);
            break;
        }
    }
    display_cards();
}