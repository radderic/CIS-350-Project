from json import dumps

class MagicCard(object):
    def __init__(self, card):
        self.name = card.name
        self.multiverse_id = card.multiverse_id
        self.image_url = card.image_url
        self.colors = card.colors
        self.type = card.types
        self.set = card.set_name
        self.rarity = card.rarity

        if(card.names):
            self.double_sided = True
        else:
            self.double_sided = False

        if(self.double_sided):
            self.other_side = card.names[1]
        else:
            self.other_side = ""

        self.count = 1

    def to_json(self):
        return dumps({
            self.multiverse_id: {
                "card_name": self.name,
                "image_url": self.image_url,
                "colors": self.colors,
                "type": self.type,
                "rarity": self.rarity,
                "set": self.set,
                "double-sided": self.double_sided,
                "other-side": self.other_side,
                "count": self.count,
            }
        })

    def to_dict(self):
        return {
            self.multiverse_id: {
                "card_name": self.name,
                "image_url": self.image_url,
                "colors": self.colors,
                "type": self.type,
                "rarity": self.rarity,
                "set": self.set,
                "double-sided": self.double_sided,
                "other-side": self.other_side,
                "count": self.count,
            }
        }

