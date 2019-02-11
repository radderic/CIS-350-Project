var collection;

$.ajax({
    data : {
        fetch : "fetch"
    },
    type : 'POST',
    url: '/fetch'
})
.done(function(data) {
    if(data.error) {
        console.log(data.error)
    }
    else {
        display_cards(data.success);
    }
})

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
            console.log(data.error)
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
            console.log(data.error)
        }
        else {
            collection = JSON.parse(data.success);
            $("#draft-deck").text("");
            let total = collection['count']
            $(".total-cards").text(`Total cards: ${total}`);
        }
    })
    event.preventDefault();
});


function reload_buttons() {
    $('.add-card').off().click(function(event) {
        $.ajax({
            data : {
                add_card : $(this).val()
            },
            type : 'POST',
            url: '/add'
        })
        .done(function(data) {
            if(data.error) {
                console.log(data.error)
            }
            else {
                display_cards(data.success);
            }
        })
        event.preventDefault();
    });
    $('.sub-card').off().click(function(event) {
        $.ajax({
            data : {
                sub_card : $(this).val()
            },
            type : 'POST',
            url: '/sub'
        })
        .done(function(data) {
            if(data.error) {
                console.log(data.error)
            }
            else {
                display_cards(data.success);
            }
        })
        event.preventDefault();
    });

}

function display_cards(data) {
    collection = JSON.parse(data);
    let total = collection['count']
    $("#draft-deck").text("");
    $(".total-cards").text(`Total cards: ${total}`);
    for(card in collection) {
        if(card !== 'count') {
            let name = collection[card]['card_name']
            let count = collection[card]['count']
            $("#draft-deck").append(`<div class="collection-card">
                <p>${name} x ${count}</p>
                <button value=${card} name="add_card" class="add-card">+</button>
                <button value=${card} name="sub_card" class="sub-card">-</button>
                </div>`);
        }
    }
    reload_buttons();
}

