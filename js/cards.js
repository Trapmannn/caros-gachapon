/**
 * ============================================
 * KARTEN-DEFINITIONEN
 * ============================================
 *
 * Hier kannst du deine eigenen Karten hinzufuegen!
 *
 * Jede Karte braucht:
 *   - id: Eindeutige Nummer (1, 2, 3, ...)
 *   - image: Pfad zum Bild (z.B. 'images/meinbild.jpg')
 *   - title: Titel auf der Rueckseite
 *   - text: Persoenlicher Text auf der Rueckseite
 *   - rarity: Seltenheit ('common', 'rare', 'epic', 'legendary')
 *
 * SELTENHEITEN:
 *   - 'common' (Gewoehnlich/Gruen): 50% Wahrscheinlichkeit
 *   - 'rare' (Selten/Blau): 30% Wahrscheinlichkeit
 *   - 'epic' (Episch/Lila): 15% Wahrscheinlichkeit
 *   - 'legendary' (Legendaer/Gold): 5% Wahrscheinlichkeit
 *
 * BILDFORMAT:
 *   - Seitenverhaeltnis: 3:4 (Hochformat/Portrait)
 *   - Empfohlene Groesse: 400x533 Pixel oder hoeher
 *   - Formate: JPG, PNG, WebP
 *
 * BEISPIEL:
 *   {
 *       id: 8,
 *       image: 'images/unser-urlaub.jpg',
 *       title: 'Unser Urlaub',
 *       text: 'Erinnerst du dich an diesen wunderschoenen Tag?',
 *       rarity: 'epic'
 *   }
 *
 * ============================================
 */

// Rarity configuration
const RARITY_CONFIG = {
    common: {
        name: 'Gewöhnlich',
        color: '#4ade80',
        probability: 0,
        order: 0
    },
    rare: {
        name: 'Selten',
        color: '#3b82f6',
        probability: 0,
        order: 1
    },
    epic: {
        name: 'Episch',
        color: '#a855f7',
        probability: 0,
        order: 2
    },
    legendary: {
        name: 'Legendär',
        color: '#ffd700',
        probability: 0,
        order: 3
    },
    voucher: {
        name: 'Gutschein',
        color: '#ff00ff',
        probability: 1.0,
        order: 99,
        isVoucher: true
    }
};

const allCards = [
    {
        id: 1,
        image: 'images/5ee5e831-3f44-4534-b1b6-feaae889427a.JPG',
        title: 'Wiesn Mäuse',
        text: 'Sorry Marie du bist hier nur Nummer 2... aber wer sich im Dirndl mit Caro messen will, verliert halt einfach!',
        rarity: 'common'
    },
    {
        id: 2,
        image: 'images/0f13f358-9898-4ed6-85ed-214329d9eb25.JPG',
        title: 'SAKARTVELO',
        text: 'Gebt mir die zweite Staatsbürgerschaft! შენთვის ყველა რუსს მოვკლავდი!',
        rarity: 'rare'
    },
    {
        id: 3,
        image: 'images/6bcac5e4-983f-4b2b-b980-062c6882323d.JPG',
        title: 'Die Schönheit in Person',
        text: 'Dich muss ich mir nichtmal schön trinken!',
        rarity: 'rare'
    },
    {
        id: 4,
        image: 'images/7bd02529-2c3b-4eeb-a1ce-63da1603512d.JPG',
        title: 'Oma approved',
        text: 'Meine Oma sagt, ich soll dich heiraten. Also wann machen wir das?',
        rarity: 'epic'
    },
    {
        id: 5,
        image: 'images/7dde5826-9934-4cd2-aeba-9f7afd1bfefd.JPG',
        title: 'Sport oder so',
        text: 'Meine Freundin ist so sportlich, da kann sogar Rahul nichts sagen.',
        rarity: 'rare'
    },
    {
        id: 6,
        image: 'images/9f2ce7e0-da6e-4b39-8ea0-e892d710da43.JPG',
        title: 'Cafe Dates',
        text: 'Du bist meine Mangososse zu meinem Iced Matcha Latte.',
        rarity: 'common'
    },
    {
        id: 7,
        image: 'images/c94fc657-17cd-474a-bb8e-99dea3dd89d4.JPG',
        title: 'Kuschelzeit',
        text: 'Das einzige Pärchen in Batumi, das sowas machen kann und nicht cringe ist.',
        rarity: 'legendary'
    },
    {
        id: 8,
        image: 'images/61a64324-4bf7-48a6-b185-92dbf0127951.JPG',
        title: 'Bergsteigen in Kufstein',
        text: 'Hier das erste mal spielsüchtig werden... couple goals oder so.',
        rarity: 'common'
    },
    {
        id: 9,
        image: 'images/76a7fc4f-14a0-4caa-b0e0-88c5f1ee35c4.JPG',
        title: 'Was ein Ausblick',
        text: 'Einen noch schöneren Ausblick gibt es nur, wenn du keinen BH anhast.',
        rarity: 'epic'
    },
    {
        id: 10,
        image: 'images/85dece0d-7de6-47ae-a66b-e7a975c5f637.JPG',
        title: 'Natur pur',
        text: 'Die meisten Menschen brauchen Photoshop, um so auszusehen wie du!',
        rarity: 'legendary'
    },
    {
        id: 11,
        image: 'images/121e83b3-1892-4f8b-8721-4542a6726058.JPG',
        title: 'Verletzung kein Problem',
        text: 'Der Körper ist vergänglich, meine Liebe zu dir ist unendlich!',
        rarity: 'common'
    },
    {
        id: 12,
        image: 'images/662bd973-33e8-4d55-9386-0bf3f3fd648c.JPG',
        title: 'Beach Waves',
        text: 'So viel Welle wie deine Haare am Strand schieb nur ich, wenn ich dich 2 Tage nicht sehe!',
        rarity: 'common'
    },
    {
        id: 13,
        image: 'images/816b7018-2f22-40d0-add6-2be050b4ccbe.JPG',
        title: 'Opas Liebling',
        text: 'Wenn ich so alt bin wie mein Opa, bist du hoffentlich immer noch mein Babe',
        rarity: 'rare'
    },
    {
        id: 14,
        image: 'images/848a2e18-e973-4843-99dc-40d7f3b74df7.JPG',
        title: 'McDonalds vs McFit',
        text: 'Wir haben einen klaren verlierer... aber wenn es sich einer leisten kann, dann du!',
        rarity: 'common'
    },
    {
        id: 15,
        image: 'images/628622a7-e703-4ac7-a124-d0f681b90c4b.JPG',
        title: 'Ge Leck',
        text: 'Diese Zunge hat immer neue Überraschungen auf Lager. Fun Fact: Ich bin hart geworden als ich diese Karte erstellt habe...',
        rarity: 'epic'
    },
    {
        id: 16,
        image: 'images/7931004c-54e1-433d-af68-3c17b1ad0157.JPG',
        title: 'Rarrr',
        text: 'Meine Löwin, meine Bärin, mein Einhorn. Du bist alles für mich auch wenn du mich manchmal anfauchst.',
        rarity: 'common'
    },

    // =============================================
    // GUTSCHEIN-KARTEN (Verbrauchskarten)
    // =============================================
    {
        id: 100,
        image: 'images/voucher-massage.jpg',
        title: 'Massage-Gutschein',
        text: 'Ein entspannender Massage-Gutschein, einlösbar bei deinem Lieblingsmenschen!',
        rarity: 'voucher',
        voucherType: 'massage'
    },
    {
        id: 101,
        image: 'images/voucher-date.jpg',
        title: 'Date-Night Gutschein',
        text: 'Ein romantischer Abend nach Wahl - Restaurant, Kino oder was auch immer du willst!',
        rarity: 'voucher',
        voucherType: 'date'
    },
    {
        id: 102,
        image: 'images/voucher-wish.jpg',
        title: 'Wunsch-Gutschein',
        text: 'Ein Wunsch frei! (Im Rahmen des Möglichen natürlich...)',
        rarity: 'voucher',
        voucherType: 'wish'
    }

    // =============================================
    // FUEGE HIER DEINE EIGENEN KARTEN HINZU:
    // =============================================
    // {
    //     id: 8,
    //     image: 'images/dein-bild.jpg',
    //     title: 'Dein Titel',
    //     text: 'Dein persoenlicher Text hier...',
    //     rarity: 'rare'
    // },
];
