# Spatial Decryption

Spatial Decryption transforme un court message en animation sur une grille isométrique de 3 × 3 cubes. Chaque lettre correspond à un motif. Pour retrouver le message, observe les cubes qui se soulèvent et sélectionne les cases correspondantes.

**[Essayer la démo](https://samy-asl.github.io/Spatial-Decryption/)**

## Prise en main

1. Saisis un message de 40 caractères maximum (lettres A–Z, a–z et espaces) ou clique sur **Try an example**.
2. Lance **Play animation**. Tu peux ensuite revoir l’animation ou télécharger la vidéo si ton navigateur prend en charge l’enregistrement.
3. Clique sur **Start decoding**, sélectionne les cases d’un motif dans l’ordre de ton choix, puis clique sur **Add character**. Le dictionnaire intégré affiche les 26 motifs en français et en anglais.

Pour une majuscule, ajoute la case centrale bleue (4) au motif de la lettre. Pour un espace, sélectionne les neuf cases. Les [règles détaillées](Rules.txt) décrivent le système de codage.

## Lancer en local

Le projet utilise HTML, CSS et JavaScript avec Canvas. Il tourne sans dépendances à installer ni étape de compilation.

```sh
git clone https://github.com/Samy-Asl/Spatial-Decryption.git
cd Spatial-Decryption
python -m http.server 8000
```

Ouvre [localhost:8000](http://localhost:8000). Si Python 3 est disponible sous la commande `python3`, utilise `python3 -m http.server 8000`.

Pour vérifier l’encodage et le décodage avec Node.js, lance `node --test tests/spatial-code.test.mjs`.
