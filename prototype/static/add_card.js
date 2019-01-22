
$(document).ready(function() {
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
                console.log(data.success)
                $("#draft-deck").text(data.success)
            }
        })
        event.preventDefault();
    });
});

$(document).ready(function() {
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
                console.log(data.success)
                $("#draft-deck").text(data.success)
            }
        })
        event.preventDefault();
    });
});
