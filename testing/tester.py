"""
    > coverage run tester.py
    > coverage html --omit="/usr/*" --directory="./docs/python"
"""
import unittest
from app import app
import io

class TestWebsite(unittest.TestCase):
    """
    Tester class which executes the series of functions
    below for unit testing purposes
    """
    def setUp(self):
        """
        Creates app for which to test with
        """
        app.config['TESTING'] = True
        self.app = app.test_client()

    def test_valid_pages(self):
        """
        Validates known valid pages
        """
        result = self.app.get('/')
        self.assertEqual(result.status_code, 200)
        result = self.app.get('/search/page/1')
        self.assertEqual(result.status_code, 200)
        result = self.app.get('/search/page/2')
        self.assertEqual(result.status_code, 200)
        result = self.app.get('/sealed')
        self.assertEqual(result.status_code, 200)
        result = self.app.get('/draft')
        self.assertEqual(result.status_code, 200)


    def test_invalid_pages(self):
        """
        Checks for pages that should not be valid
        """
        result = self.app.get('/search/page/0')
        self.assertEqual(result.status_code, 404, 'page 0 is not valid')
        result = self.app.get('/search/page/-1')
        self.assertEqual(result.status_code, 404)
        result = self.app.get('/search/page/')
        self.assertEqual(result.status_code, 404)
        result = self.app.get('/search/page/99999999999999999999999')
        self.assertEqual(result.status_code, 404)

    def test_search(self):
        """
        Tries various searches to ensure they are valid
        """
        result = self.app.get('/search/page/1?name=bolas&color=&set=&type=')
        self.assertEqual(result.status_code, 200)
        result = self.app.get('/search/page/1?name=&color=black&set=&type=')
        self.assertEqual(result.status_code, 200)
        result = self.app.get('/search/page/1?name=&color=&set=limited&type=')
        self.assertEqual(result.status_code, 200)
        result = self.app.get('/search/page/1?name=&color=&set=limited&type=creature')
        self.assertEqual(result.status_code, 200)

    def test_add_onecard(self):
        """
        Tests adding a singular card and validates the session
        """
        result = self.app.get('/search/page/1?name=bolas&color=&set=&type=')
        self.assertEqual(result.status_code, 200)
        result = self.post_add(442198)
        self.assertEqual(result.status_code, 200)
        with self.app.session_transaction() as sess:
            self.assertIsNotNone(
                sess['card_pool']['442198'],
                msg="unable to add card with id 442198")
            self.assertEqual(
                sess['card_pool']['442198']['count'],
                1,
                msg="unable to add second card")

    def test_add_twocard(self):
        """
        Tests adding two cards, validates count in session for 2
        """
        result = self.app.get('/search/page/1?name=bolas&color=&set=&type=')
        self.assertEqual(result.status_code, 200)
        result = self.post_add(178020)
        self.assertEqual(result.status_code, 200)
        result = self.post_add(178020)
        self.assertEqual(result.status_code, 200)
        with self.app.session_transaction() as sess:
            self.assertIsNotNone(
                sess['card_pool']['178020'],
                msg="unable to add card with id 178020")
            self.assertEqual(
                sess['card_pool']['178020']['count'],
                2,
                msg="unable to add second card")

    def test_add_one_weird(self):
        """
        If a user submits an invalid POST request without being
        on the search page it gets ignored
        """
        result = self.app.get('/')
        self.assertEqual(result.status_code, 200)
        result = self.post_add(442198)
        self.assertEqual(result.status_code, 200)
        with self.app.session_transaction() as sess:
            self.assertIn(
                'card_pool',
                sess,
                msg="Could not create empty card_pool")

    def test_add_one_diff_page(self):
        """
        If a user submits an invalid POST request without being
        on the search page it gets ignored
        """
        result = self.app.get('/search/page/1?name=bolas&color=&set=&type=')
        self.assertEqual(result.status_code, 200)
        result = self.post_add(442198)
        result = self.app.get('/search/page/2?name=bolas&color=&set=&type=')
        result = self.post_add(442198)
        self.assertEqual(result.status_code, 200)
        with self.app.session_transaction() as sess:
            self.assertEqual(
                sess['card_pool']['442198']['count'],
                2,
                msg="unable to add second card")


    def test_sub_one_from_two(self):
        """
        Tests adding two (of the same) cards then subtracting the card
        checks for count of 1
        """
        result = self.app.get('/search/page/1?name=bolas&color=&set=&type=')
        self.assertEqual(result.status_code, 200)
        result = self.post_add(442198)
        self.assertEqual(result.status_code, 200)
        result = self.post_add(442198)
        self.assertEqual(result.status_code, 200)
        result = self.post_sub(442198)
        self.assertEqual(result.status_code, 200)
        with self.app.session_transaction() as sess:
            self.assertEqual(
                sess['card_pool']['442198']['count'],
                1,
                msg="unable to add second card")

    def test_sub_one_from_empty(self):
        """
        Attempts to subtract one from empty session data
        """
        result = self.post_sub(442198)
        self.assertEqual(result.status_code, 200)

    def test_sub_one_from_one(self):
        """
        Adds then subtracts card to see if the id is removed from session['card_pool']
        """
        result = self.app.get('/search/page/1?name=bolas&color=&set=&type=')
        self.assertEqual(result.status_code, 200)
        result = self.post_add(442198)
        self.assertEqual(result.status_code, 200)
        result = self.post_sub(442198)
        self.assertEqual(result.status_code, 200)
        with self.app.session_transaction() as sess:
            self.assertNotIn('442198', sess['card_pool'])

    def test_sub_too_much(self):
        """
        Attempts to subtract two cards from one, should be ignored
        """
        result = self.app.get('/search/page/1?name=bolas&color=&set=&type=')
        self.assertEqual(result.status_code, 200)
        result = self.post_add(442198)
        self.assertEqual(result.status_code, 200)
        result = self.post_sub(442198)
        self.assertEqual(result.status_code, 200)
        result = self.post_sub(442198)
        self.assertEqual(result.status_code, 200)

    def test_clear(self):
        """
        Adds a card then clears the session data card_pool
        Verifies count is set to 0
        """
        result = self.app.get('/search/page/1?name=bolas&color=&set=&type=')
        self.assertEqual(result.status_code, 200)
        result = self.post_add(442198)
        self.assertEqual(result.status_code, 200)
        result = self.post_clear()
        self.assertEqual(result.status_code, 200)
        with self.app.session_transaction() as sess:
            self.assertEqual(sess['card_pool'], {'count':0})
            self.assertEqual(sess['card_pool']['count'], 0)

    def test_empty_fetch(self):
        """
        Verifies fetching works for an nonexisting deck
        """
        result = self.post_fetch()
        self.assertEqual(result.status_code, 200)

    def test_fetch(self):
        """
        Verifies fetching works for an existing deck
        """
        result = self.app.get('/search/page/1?name=bolas&color=&set=&type=')
        self.assertEqual(result.status_code, 200)
        result = self.post_add(442198)
        result = self.app.get('/sealed')
        result = self.post_fetch()
        self.assertEqual(result.status_code, 200)

    def test_import(self):
        filename = './testing/sample_inputs/deck.json'
        result = self.post_file(filename)
        self.assertEqual(result.status_code, 200);
        filename = './testing/sample_inputs/invalid.json'
        result = self.post_file(filename)
        self.assertEqual(result.status_code, 200);
        result = self.post_nameless_file(filename)
        self.assertEqual(result.status_code, 200);


    def post_add(self, card_id):
        """
        Simulates a POST request to add a card from the client
        """
        return self.app.post('/add', data=dict(add_card=card_id), follow_redirects=True)

    def post_sub(self, card_id):
        """
        Simulates a POST request to subtract a card from the client
        """
        return self.app.post('/sub', data=dict(sub_card=card_id), follow_redirects=True)

    def post_clear(self):
        """
        Simulates a POST request to clear the deck from the client
        """
        return self.app.post('/clear', data=dict(clear='clear'), follow_redirects=True)

    def post_fetch(self):
        """
        Simulates a POST request to fetch the session deck for the client
        """
        return self.app.post('/fetch', data=dict(fetch='fetch'), follow_redirects=True)

    def post_file(self, filename):
        data = {}
        f = open(filename, 'r')
        data['file'] = (io.BytesIO(bytes(f.read(), encoding='utf-8')), filename)
        f.close()
        return self.app.post('/import', data=data, follow_redirects=True, content_type='multipart/form-data')

    def post_nameless_file(self, filename):
        data = {}
        data['file'] = (io.BytesIO(bytes('test', encoding='utf-8')), '')
        return self.app.post('/import', data=data, follow_redirects=True, content_type='multipart/form-data')

if __name__ == "__main__":
    unittest.main(verbosity=2)
