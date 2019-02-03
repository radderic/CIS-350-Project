//all cards
var collection;

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
        console.log(data.error)
    }
    else {
        collection = JSON.parse(data.success);
        sortRarity(collection);
    }
});


function sortRarity(collection) {
    for(card in collection) {
        if(card !== 'count') {
            let count = collection[card].count
            for(var i = 0; i < count; i++) {
                if(collection[card].rarity === 'Common')
                    commons.push(card);
                else if(collection[card].rarity === 'Uncommon')
                    uncommons.push(card);
                else if(collection[card].rarity === 'Rare')
                    rares.push(card);
                else if(collection[card].rarity === 'Mythic')
                    mythics.push(card);
            }
        }
    }
}
