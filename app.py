"""
The backend for running a Magic the Gathering server which fetches Magic card information
    using the mtgsdk package and sends it back to the frontend for displaying.

    This manages:
        - generating and sending the editcollection.html template with pagination
        - quering the mtgsdk for cards based on frontend selections via query strings (GET requests)
        - creating and modifying the users session data which holds the current deck being built
        - adding, subtracting and clearing cards from the session data (POST requests)
        - ajax requests to fetch the session data if it exists (POST requests)
        - routing to additional html pages as needed
"""

from json import dumps, loads
from json.decoder import JSONDecodeError
from flask import Flask, render_template, request, session, jsonify, abort, redirect, url_for, flash
from mtgsdk import Card, Set
from mtgsdk.restclient import MtgException
from utils.magic_card import MagicCard

app = Flask(__name__)

#create list for set names once then never again
#Not sure if this is considered global among sessions
sets = Set.all()
set_names = []
for s in sets:
    set_names.append(s.name)
del sets

#very secure, required for session data
app.secret_key = "test"

@app.route('/search/page/<int:page>', methods=['GET', 'POST'])
def search(page):
    """
    Manges the editcollection.html template which a user can search for cards
        via the mtgsdk.

        At most 10 cards are sent back to the page, if there are cards on the next page
        there will be an option to change page available via the template.
            - the template has a button "Next Page", when clicked it sends back the current page + 1

        The user may add, subtract and clear them to session data, to create a pool from which
            to simulate a draft from
    """
    if page < 1:
        abort(404)

    #create a card_pool if it doesn't exist
    if 'card_pool' not in session:
        session['card_pool'] = {}
        session['card_pool']['count'] = 0

    #get string querys from url to use for search
    name = request.args.get('name', default="")
    color = request.args.get('color', default="")
    set_name = request.args.get('set', default="")
    card_type = request.args.get('type', default="")

    #search using the mtgapi
    try:
        cards = Card.where(
            name=name,
            page=page,
            types=card_type,
            colors=color,
            setName=set_name,
            contains='multiverseId').where(pageSize=10).all()
    except MtgException:
        abort(404)

    session['cache'] = {}
    for card in cards:
        session['cache'].update(MagicCard(card).to_dict())

    #handle pagination
    has_prev = False
    has_next = False
    if page > 1:
        has_prev = True
    next_page_cards = Card.where(
        name=name,
        page=page+1,
        types=card_type,
        colors=color,
        setName=set_name,
        contains='multiverseId').where(pageSize=10).all()

    if next_page_cards:
        has_next = True

    return render_template(
        'editcollection.html',
        set_names=set_names,
        cards=cards,
        has_next=has_next,
        has_prev=has_prev,
        page=page)

@app.route('/')
def index():
    """
    Routes users to the homepage
    """
    return render_template('index.html')

@app.route('/add', methods=['POST'])
def add_card():
    """
    Manages the addtion of cards to the users session data

    A card is requested to be added by multiverse_id (unique to each card)
        to be added to card_pool

    If a card_pool doesn't exist yet, it is created here initialized as
        an empty dictionary in the session variable called card_pool.
        It is given an additional field 'count' which is the total number of cards
        in the card pool so far.

    Overall this should be imagined as a JSON format that will be sent to the frontend
        for parsing.

    A card can only be added if it exists in the session data variable 'cache'
    The cache specifically holds data for each card being viewed on the CURRENT page.

    The cache handles two very important things:
        1. It removes the need to query the database more than once per page
        2. Guarentees that the user cannot add cards that do not exist

    Once the card is found in the cache it copies the data regarding that specific
        card into card_pool so it maybe interpretted as a JSON structure

    Finally the session data card_pool is converted to a string (jsonify)
    and sent back to the frontend for parsing.
    """
    if 'card_pool' not in session:
        session['card_pool'] = {}
        session['card_pool']['count'] = 0

    if 'cache' in session:
        card_to_add = request.form.get('add_card')
        if card_to_add and request.method == 'POST':
            if card_to_add in session['cache']:
                if card_to_add not in session['card_pool']:
                    tmp = {}
                    tmp[card_to_add] = {}
                    tmp[card_to_add].update(session['cache'][card_to_add])
                    session['card_pool'].update(tmp)
                else:
                    session['card_pool'][card_to_add]['count'] += 1
                session['card_pool']['count'] += 1
                session.modified = True
                return jsonify({'success' : dumps(session['card_pool'])})
            elif card_to_add in session['card_pool']:
                session['card_pool'][card_to_add]['count'] += 1
                session['card_pool']['count'] += 1
                session.modified = True
                return jsonify({'success' : dumps(session['card_pool'])})
    return jsonify({'error': 'failed to add'})


@app.route('/sub', methods=['POST'])
def sub_card():
    """
    Manages the subtraction/removal of a card from session data card_pool

    A singular card is requested by multiverse_id (unique to each card) to
    be removed from card_pool

    If it exists (under specific circumstances it couldn't) it is removed
        from card_pool

    After removal the newly changed card_pool is sent back to the frontend
        as a JSON string
    """
    if 'card_pool' not in session:
        return jsonify({'error': 'Card pool does not exist yet'})

    card_to_sub = request.form.get('sub_card')
    if card_to_sub and request.method == 'POST':
        if card_to_sub not in session['card_pool']:
            return jsonify({'error': 'Card not found in deck'})
        else:
            if session['card_pool'][card_to_sub]['count'] == 1:
                del session['card_pool'][card_to_sub]
            elif session['card_pool'][card_to_sub]['count'] > 1:
                session['card_pool'][card_to_sub]['count'] -= 1
            session['card_pool']['count'] -= 1
            session.modified = True
            return jsonify({'success' : dumps(session['card_pool'])})

@app.route('/fetch', methods=['POST'])
def fetch():
    """
    Returns the stored session data that is card_pool via a POST request
    """
    if 'card_pool' in session:
        return jsonify({'success' : dumps(session['card_pool'])})
    return jsonify({'error': 'Nothing to fetch'})

@app.route('/clear', methods=['POST'])
def clear():
    """
    Empties the session data that is card_pool and sets the count to 0
    """
    session['card_pool'] = {}
    session['card_pool']['count'] = 0
    session.modified = True
    return jsonify({'success' : dumps(session['card_pool'])})

@app.route('/sealed')
def sealed():
    """
    Routes the user to sealed.html
    """
    return render_template('sealed.html')


@app.route('/draft')
def draft():
    """
    Routes the user to draft.html
    """
    return render_template('draft.html')

@app.route('/import', methods=['POST'])
def import_deck():
    """
    Reads and validates JSON file recieved from user.

    Upon successful read, the session data card_pool is set to the read data
    """
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file selected')
            return redirect(url_for('search', page=1))
        json_file = request.files['file']
        if json_file.filename == '':
            flash('Failed to find filename')
            return redirect(url_for('search', page=1))
        try:
            session['card_pool'] = loads(json_file.read())
        except JSONDecodeError:
            flash('Invalid JSON')
            return redirect(url_for('search', page=1))
    return redirect(url_for('search', page=1))

#@app.route('/invalid')
@app.errorhandler(404)
def page_not_found(error):
    """
    If the user manages to go to an impossible page it returns a blank page
        with the message 404: Page not found
    """
    print(error)
    return render_template('404.html'), 404

if __name__ == '__main__':
    app.run(debug=True, use_reloader=True)
