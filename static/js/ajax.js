"use strict";
var collection;

/**
 * Function: fetch
 * On page load submits a post request using JQuery
 * retrieve the deck created
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
        display_cards(data.success);
        count_rarity();
    }
});

/**
 * Function: add_card
 * On button click it submits a post request using JQuery
 * to add a card and display
 */
$(".add-card").on("click", function(event) {
    $.ajax({
        data : {
            add_card : $(this).val()
        },
        type : "POST",
        url: "/add"
    })
    .done(function(data) {
        if(data.error) {
            console.log(data.error);
        }
        else {
            display_cards(data.success);
            count_rarity();
        }
    });
    event.preventDefault();
});

/**
 * Function: clear_deck
 * On button clear click submits a post request using JQuery
 * to clear the deck and display
 */
$("#clear-deck").on("click", function(event) {
    $.ajax({
        data : {
            clear : "clear"
        },
        type : "POST",
        url: "/clear"
    })
    .done(function(data) {
        if(data.error) {
            console.log(data.error);
        }
        else {
            collection = JSON.parse(data.success);
            $("#draft-deck").text("");
            let total = collection.count;
            $(".total-cards").text(`Total cards: ${total}`);
            count_rarity();
        }
    });
    event.preventDefault();
});


/**
 * Function: reload_buttons
 * Each button is dynamically added to the page, thus they need
 * to remove the event listener and re-add it, hence reload.
 */
function reload_buttons() {
    $(".add-card").off().click(function(event) {
        $.ajax({
            data : {
                add_card : $(this).val()
            },
            type : "POST",
            url: "/add"
        })
        .done(function(data) {
            if(data.error) {
                console.log(data.error);
            }
            else {
                display_cards(data.success);
                count_rarity();
            }
        });
        event.preventDefault();
    });
    $(".sub-card").off().click(function(event) {
        $.ajax({
            data : {
                sub_card : $(this).val()
            },
            type : "POST",
            url: "/sub"
        })
        .done(function(data) {
            if(data.error) {
                console.log(data.error);
            }
            else {
                display_cards(data.success);
                count_rarity();
            }
        });
        event.preventDefault();
    });
}

/**
 * Function: display_cards
 * Takes data and transforms it into a list to display to the user
 * @param {*} data a collection of cards as a JSON object
 */
function display_cards(data) {
    collection = JSON.parse(data);
    let total = collection.count;
    $("#draft-deck").text("");
    $(".total-cards").text(`Total cards: ${total}`);
    for(var card in collection) {
        if(card !== "count") {
            let name = collection[card].card_name;
            let count = collection[card].count;
            $("#draft-deck").append(`<div class="collection-card">
                <p>${name} x ${count}</p>
                <button value=${card} name="add_card" class="add-card">+</button>
                <button value=${card} name="sub_card" class="sub-card">-</button>
                </div>`);
        }
    }
    reload_buttons();
}


/**
 * Function: Count Rarity
 * Takes the entire collection (draft pool of cards) and counts each card for rarity.
 *
 */
function count_rarity() {
    let numCommons = 0;
    let numUncommons = 0;
    let numRares = 0;
    let numMythics = 0;
    for (var card in collection) {
        if (card !== "count") {
            let count = collection[card].count;
            for (var i = 0; i < count; i++) {
                if (collection[card].rarity === "Common") {
                    numCommons++;
                } else if (collection[card].rarity === "Uncommon") {
                    numUncommons++;
                } else if (collection[card].rarity === "Rare") {
                    numRares++;
                } else if (collection[card].rarity === "Mythic") {
                    numMythics++;
                }
            }
        }
    }
    $("#common-count").text(`${numCommons}`);
    $("#uncommon-count").text(`${numUncommons}`);
    $("#rare-count").text(`${numRares}`);
    $("#mythic-count").text(`${numMythics}`);
}


$("#close-import").on("click", function(event) {
    $("#import-overlay").hide();
});

$("#import-deck").on("click", function(event) {
    $("#import-overlay").show();
});

