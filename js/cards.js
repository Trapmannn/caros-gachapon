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
 *       text: 'Erinnerst du dich an diesen wunderschoenen Tag?'
 *   }
 *
 * ============================================
 */

const allCards = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400',
        title: 'Suesse Katze',
        text: 'Diese kleine Katze erinnert mich an unseren ersten gemeinsamen Abend. Du hast gesagt, du liebst Katzen mehr als alles andere!'
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400',
        title: 'Neugieriger Blick',
        text: 'So schaust du mich immer an, wenn ich etwas Lustiges sage. Dieser Blick ist unbezahlbar!'
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
        title: 'Treuer Freund',
        text: 'Ein Hund ist der beste Freund des Menschen - aber du bist mein allerbester Freund!'
    },
    {
        id: 4,
        image: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=400',
        title: 'Flauschiges Wunder',
        text: 'Weisst du noch, als wir zusammen im Park waren und diesen suessen Hund gesehen haben?'
    },
    {
        id: 5,
        image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400',
        title: 'Kleine Pfoten',
        text: 'Manchmal wuensche ich mir, wir haetten zusammen ein kleines Haustier. Was meinst du?'
    },
    {
        id: 6,
        image: 'https://images.unsplash.com/photo-1494256997604-768d1f608cac?w=400',
        title: 'Kuschelzeit',
        text: 'Diese Karte steht fuer all die gemuetlichen Abende, die wir zusammen verbracht haben.'
    },
    {
        id: 7,
        image: 'images/c94fc657-17cd-474a-bb8e-99dea3dd89d4.JPG',
        title: 'Kuschelzeit',
        text: 'Die aller suesseste Caro von allen! Mit dem suessesten Knaben der Stadt am Strand von Batumi.'
    }

    // =============================================
    // FUEGE HIER DEINE EIGENEN KARTEN HINZU:
    // =============================================
    // {
    //     id: 8,
    //     image: 'images/dein-bild.jpg',
    //     title: 'Dein Titel',
    //     text: 'Dein persoenlicher Text hier...'
    // },
];
