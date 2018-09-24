![enter image description here](https://raw.githubusercontent.com/Spikharpax/Avatar-Serveur/master/logo/Avatar.jpg)
![enter image description here](https://camo.githubusercontent.com/aa33c322186b2ea1d60eff45d29c31168c090cb9/68747470733a2f2f75706c6f61642e77696b696d656469612e6f72672f77696b6970656469612f636f6d6d6f6e732f7468756d622f322f32352f4b6f64692d6c6f676f2d5468756d626e61696c2d6c696768742d7472616e73706172656e742e706e672f32323070782d4b6f64692d6c6f676f2d5468756d626e61696c2d6c696768742d7472616e73706172656e742e706e67)

**Fonctions :**

-   Démarrer / Fermer le médiacenter.
-   Activer le mode mutimédia (askme). *_Active le mode multimédia_ (télécommande vocale)
    -   Navigation complète dans le médiacenter [ _haut/monte - bas/descend - droite - gauche - retour_].
    -   Navigation rapide dans les menus [_menu principal - menu musique - menu film - menu série - affiche la météo_ ] etc...
    -   Commandes [ _play - pause - stop - suivant -précédent_ ].
    -   Réglage du volume [ _Règle le volume à x % - active/remets le son/volume - coupe/désactive le son/volume_ ].
    -   Lecture de la musique selon [ _artiste - genre - titre - album_ ].
    -   Lecture d'un film selon le titre [ _lance/je veux regarder ... le film xxx_ ].
    -   Lancement de la radio selon votre choix. (_voir fichier : /xml/radios.xml_).
    -   Exécute la mise à jour des bibliothèques [ _update médiathèque musique/vidéo_].
    - Quitter [Quitte le mode multimédia] (télécommande vocale).

**Configuration :**

Dans le fichier kodi.prop

- "path_kodi": "PATH_KODI_WINDOWS",  *Ex : "C:\Program    Files\Kodi\kodi.exe"* 
- "where_is_kodi" : "SALON",  *Nom de la pièce ou est installé kodi* 
- "ip_kodi": "192.168.0.20", *Adresse ip KODI* 
- "port_kodi": "8585" *Port utilisé pour le contrôle*
- "speech": {
        "no_mute": [ "Android", "Chambre" ]
		
		
**Version :**

Version 1.2 (23-08-2018)
Version 1.2.2 (25-08-2018)

[x] Ajout de la fonction play/pause lors de l'activation de l'écoute
[x] Correction lors de la recherche audio par artiste / albums

Version 1.30.0 (24-09-2018)

[x] Ajout de lecture d'une série ( Prend en compte les épisodes déjà vus )
[x] Correction recherche d'items
[x] Ajout la possibilité de changer de viewmode (affichage en mode fanart - liste - miniatures)
[x] Ajout la fonction quitter le mode multimédia si vous lancé une commande du type play [ fichier prop = exit_multimedia_after_play": true ]
[x] Ajout la fonction scroling avant et arrière ( permet de faire défiler les item automatiquement ) [ fichier prop = "speed_scrolling": "1500" ]
