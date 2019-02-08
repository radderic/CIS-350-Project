//all cards
var collection;
var sealedresult;
var deck;

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
    var numMythics = 0;

    //numMythics compared against "magic number" 6 because it's the max possible mythics
    if(commons.length >= numCommons && uncommons.length >= numUncommons &&
        rares.length >= numRares && mythics.length >= 6 ){
        //determine how many rares will become mythics for the draft
        for(var i=0; i < 6; i++){
            //random number from 0 to 999
            var mythic = Math.floor(Math.random() * 1000);
            //"magic number" 124 derived from 12.5% chance for a rare to become a mythic
            if (mythic <= 124){
                numMythics++;
            }
        }
        //replace rares with mythics if any were generated
        numRares -= numMythics;
        
        //select 60 random commons
        for(var i = 0; i < numCommons; i++){
            //select an index
            var tempIndex = Math.floor(Math.random() * commons.length);
            //add card to sealedresult
            sealedresult.push(commons[tempIndex]);
            //remove card from rarity array to avoid double-drafting it
            commons.splice(tempIndex,1);
        }
        //select 18 random uncommons
        for(var i = 0; i < numUncommons; i++){
            var tempIndex = Math.floor(Math.random() * uncommons.length);
            sealedresult.push(uncommons[tempIndex]);
            uncommons.splice(tempIndex,1);
        }
        //select up to 6 random rares
        for(var i = 0; i < numRares; i++){
            var tempIndex = Math.floor(Math.random() * rares.length);
            sealedresult.push(rares[tempIndex]);
            rares.splice(tempIndex,1);
        }
        //select up to 6 random mythics
        for(var i = 0; i < numMythics; i++){
            var tempIndex = Math.floor(Math.random() * mythics.length);
            sealedresult.push(mythics[tempIndex]);
            mythics.splice(tempIndex,1);
        }
    }else{
        //TODO print warning to user
    }
}

$('.add-card').on('click', function(event) {
    $.ajax({
        data : {
            add_card : $(this).val()
        },
        type : 'POST',
        url: '/add'
    })
    .done(function(data) {
        if(data.error) {
            console.log(data.error);
        }
        else {
            display_cards(data.success);
        }
    })
    event.preventDefault();
});

$('#clear-deck').on('click', function(event) {
    $.ajax({
        data : {
            clear : "clear"
        },
        type : 'POST',
        url: '/clear'
    })
    .done(function(data) {
        if(data.error) {
            console.log(data.error);
        }
        else {
            collection = JSON.parse(data.success);
            $("#sealed-deck").text("");
            let total = deck['count'];
            $(".total-cards").text(`Total cards: ${total}`);
        }
    });
    event.preventDefault();
});

function display_cards(data) {
    deck = JSON.parse(data);
    let total = deck['count'];
    $("#sealed-deck").text("");
    $(".total-cards").text(`Total cards: ${total}`);
    for(var card in deck) {
        if(card !== 'count') {
            let name = deck[card]['card_name'];
            let count = deck[card]['count'];
            $("#sealed-deck").append(`<div class="collection-card">
                <p>${name} x ${count}</p>
                <button value=${card} name="add_card" class="add-card">+</button>
                <button value=${card} name="sub_card" class="sub-card">-</button>
                </div>`);
        }
    }
    reload_buttons();
}