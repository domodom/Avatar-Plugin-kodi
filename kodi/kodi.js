/* **********************************************************
 * Plugin kodi pour Avatar.IA
 * Permet de commander vocalement votre Media Center Kodi
 * Eddy TELLIER
 * Version : 1.2
 * Date Release : 23/08/2018
 ************************************************************
 */

exports.action = function (data, callback) {

    var config = Config.modules.kodi;
    var kodi_api_url = 'http://' + config.ip_kodi + ':' + config.port_kodi + '/jsonrpc';
    var client = data.client;

    var tblCommand = {
        start_kodi: function () { start_kodi(client, config); },
        close_kodi: function () {
            doAction(closekodi, kodi_api_url, callback, client);
            Avatar.speak("Le média-center est arrêté...", client, function () {
                Avatar.Speech.end(client);
            });
        },
        mode_mediacenter: function () { mode_control_kodi(kodi_api_url, callback, client, "Mode multimédia activé. Que veux tu ?") }
    }

    info("Command Kodi : ", data.action.command.yellow, "From:", client.yellow);
    tblCommand[data.action.command]();
    callback();
}

var APP_KODI = "C:\\Program Files\\Kodi\\kodi.exe";

// -------------------------------------------
//  QUERIES
//  Doc: https://kodi.wiki/view/JSON-RPC_API/v9
// -------------------------------------------

// Introspect
var introspect = { "jsonrpc": "2.0", "method": "JSONRPC.Introspect", "params": { "filter": { "id": "AudioLibrary.GetSongs", "type": "method" } }, "id": 1 }

// XML Generation
var xml_artist = { "jsonrpc": "2.0", "method": "AudioLibrary.GetArtists", "params": {}, "id": 1 }
var xml_genre = { "jsonrpc": "2.0", "method": "AudioLibrary.GetGenres", "params": {}, "id": 1 }
var xml_playlistmusic = { "jsonrpc": "2.0", "method": "Files.GetDirectory", "params": { "directory": "special://profile/playlists/music", "media": "music" }, "id": 1 }
var xml_playlistvideo = { "jsonrpc": "2.0", "method": "Files.GetDirectory", "params": { "directory": "special://profile/playlists/video", "media": "video" }, "id": 1 }
var xml_serie = { "jsonrpc": "2.0", "method": "VideoLibrary.GetTVShows", "params": {}, "id": 1 }
var xml_channel = { "id": 1, "jsonrpc": "2.0", "method": "PVR.GetChannels", "params": { "channelgroupid": "alltv", "properties": ["channel", "channeltype", "hidden", "lastplayed", "locked"] } }
var xml_film = { "jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "params": {}, "id": 1 }

// Toggle play / pause in current player
//var play = { "jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": 0 }, "id": 1 };
var Play = { "jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": 0, "play": true }, "id": 1 };
var Pause = { "jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": 0, "play": false }, "id": 1 };
var Stop = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "stop" }, "id": 1 }
var player = { "jsonrpc": "2.0", "method": "Player.GetActivePlayers", "id": 1 }
var audioPlayer = { "jsonrpc": "2.0", "method": "Player.GetItem", "params": { "properties": ["title", "album", "artist", "duration", "file"], "playerid": 0 }, "id": "AudioGetItem" }
var videoPlayer = { "jsonrpc": "2.0", "method": "Player.GetItem", "params": { "properties": ["title", "album", "artist", "season", "episode", "duration", "showtitle", "tvshowid", "file"], "playerid": 1 }, "id": "VideoGetItem" }

// Toggle play / pause in current player video
var playvideo = { "jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": 1 }, "id": 1 };

// TELECOMMANDE
var Left = { "jsonrpc": "2.0", "method": "Input.Left", "params": {}, "id": 1 }
var Right = { "jsonrpc": "2.0", "method": "Input.Right", "params": {}, "id": 1 }
var Down = { "jsonrpc": "2.0", "method": "Input.Down", "params": {}, "id": 1 }
var Up = { "jsonrpc": "2.0", "method": "Input.Up", "params": {}, "id": 1 }
var Home = { "jsonrpc": "2.0", "method": "Input.Home", "params": {}, "id": 1 }
var Select = { "jsonrpc": "2.0", "method": "Input.Select", "params": {}, "id": 1 }
var Back = { "jsonrpc": "2.0", "method": "Input.Back", "params": {}, "id": 1 }
var Info = { "jsonrpc": "2.0", "method": "Input.Info", "params": {}, "id": 1 }
var ContextMenu = { "jsonrpc": "2.0", "method": "Input.ContextMenu", "params": {}, "id": 1 }
var ShowOSD = { "jsonrpc": "2.0", "method": "Input.ShowOSD", "params": {}, "id": 1 }
// Library
var VideoLibraryScan = { "jsonrpc": "2.0", "method": "VideoLibrary.Scan", "id": 1 }
var AudioLibraryScan = { "jsonrpc": "2.0", "method": "AudioLibrary.Scan", "id": 1 }
// Send text
var sendText = { "jsonrpc": "2.0", "method": "Input.SendText", "params": { "text": "", "done": false }, "id": 1 }
// Previous / Next item in current player
var Next = { "jsonrpc": "2.0", "method": "Player.GoTo", "params": { "playerid": 0, "to": "next" }, "id": 1 }
var Prev = { "jsonrpc": "2.0", "method": "Player.GoTo", "params": { "playerid": 0, "to": "previous" }, "id": 1 }
// Query library
var genres = { "jsonrpc": "2.0", "method": "AudioLibrary.GetGenres", "params": { "properties": ["title"], "limits": { "start": 0, "end": 20 }, "sort": { "method": "label", "order": "ascending" } }, "id": "AudioLibrary.GetGenres" }
var albums = { "jsonrpc": "2.0", "method": "AudioLibrary.GetAlbums", "params": { "properties": ["artist", "artistid", "albumlabel", "year", "thumbnail", "genre"], "limits": { "start": 0, "end": 20 }, "sort": { "method": "label", "order": "ascending" } }, "id": "AudioLibrary.GetAlbumsByGenre" }
var songs = { "jsonrpc": "2.0", "method": "AudioLibrary.GetSongs", "params": { "properties": ["title", "genre", "artist", "duration", "album", "track"], "limits": { "start": 0, "end": 25 }, "sort": { "order": "ascending", "method": "track", "ignorearticle": true } }, "id": "libSongs" }
var saison = { "jsonrpc": "2.0", "method": "VideoLibrary.GetSeasons", "params": { "tvshowid": 1, "properties": ["season", "thumbnail"] }, "id": 1 }
var episode = { "jsonrpc": "2.0", "method": "VideoLibrary.GetEpisodes", "params": { "tvshowid": 1, "season": 1, "properties": ["title", "firstaired", "playcount", "runtime", "season", "episode", "file", "streamdetails", "lastplayed", "uniqueid"], "limits": { "start": 0, "end": 25 }, "sort": { "order": "ascending", "method": "track", "ignorearticle": true } }, "id": 1 }
// Playlist
var playlist = { "jsonrpc": "2.0", "method": "Playlist.GetItems", "params": { "properties": ["title", "album", "artist", "duration"], "playlistid": 0 }, "id": 1 }
var clearlist = { "jsonrpc": "2.0", "id": 0, "method": "Playlist.Clear", "params": { "playlistid": 0 } }
var addtolist = { "jsonrpc": "2.0", "id": 1, "method": "Playlist.Add", "params": { "playlistid": 0, "item": { "songid": 10 } } }
var runlist = { "jsonrpc": "2.0", "id": 2, "method": "Player.Open", "params": { "item": { "playlistid": 0 } } }
var shuffle_on = { "jsonrpc": "2.0", "method": "Player.SetShuffle", "params": { "playerid": 0, "shuffle": true }, "id": 1 }
var shuffle_off = { "jsonrpc": "2.0", "method": "Player.SetShuffle", "params": { "playerid": 0, "shuffle": false }, "id": 1 }
// Albums
var getalbumsof = { "jsonrpc": "2.0", "method": "AudioLibrary.GetAlbums", "params": { "filter": { "operator": "is", "field": "artist", "value": "" } }, "id": 1 }
// Playlistfile (Play)
var playlistmusic = { "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "file": "" }, "options": { "shuffled": true } }, "id": 1 }
// Playlistfile (Show)
var playlistvideo = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "video", "parameters": [] }, "id": 1 }
// Séries
var playserie = { "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "file": "" }, "options": { "resume": true } }, "id": 3 }
// radio
var xml_radio = '{"jsonrpc":"2.0","method":"Player.Open","params":{"item":{"file":"plugin://plugin.audio.radio_de/station/radioid"}},"id":1}'
// film
//var readmovie = { "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "movieid": '' }, "options": { "resume": '' } }, "id": 1 }
var unsetmovie = { "jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "params": { "filter": { "operator": "is", "field": "playcount", "value": "0" } }, "id": 1 }
var setsubtitle = { "jsonrpc": "2.0", "id": 1, "method": "Player.SetSubtitle", "params": { "playerid": 1, "subtitle": "" } };
// fermeture de kodi
var closekodi = { "jsonrpc": "2.0", "method": "Application.Quit", "id": "1" };


/* START KODI APPLICATION */
var start_kodi = function (client, config) {
    var done;
    Avatar.runApp(config.path_kodi, config.where_is_kodi);
    done = true;
    setTimeout(function () {
        var tts = done ? "Le média-center est maintenant lancé." : "Je n'ai pas lancé le média-center." + client;
        Avatar.speak(tts, client, function () {
            Avatar.Speech.end(client);
        });
    }, 1500);
}


var sendJSONRequest = function (url, reqJSON, callback) {
    var request = require('request');
    request({
        'uri': url,
        'method': 'POST',
        'timeout': 3000,
        'json': reqJSON
    },
        function (err, response, json) {
            if (err || response.statusCode != 200) {
                return callback(false);
            }

            callback(json);
        });
}

var handleJSONResponse = function (res, callback, client) {

    if (!res) {
        return Avatar.speak("Je n'ai pas pu contacter le média-center...", client, function () {
            Avatar.Speech.end(client);
        });
    }

    if (res.error) {
        return Avatar.speak("Je n'ai pas pu effectuer l'action...", client, function () {
            Avatar.Speech.end(client);
        });
    }
    return true;
}


var doAction = function (req, kodi_api_url, callback, client, hook) {
    sendJSONRequest(kodi_api_url, req, function (res) {
        if (!handleJSONResponse(res, callback)) {
            return;
        }
        if (hook) {
            try {
                if (!hook(res)) {
                    return;
                }
            } catch (ex) {
            }
        }
        if (callback) {
            callback({})
        };
    });
}

var doPlaylist = function (filter, kodi_api_url, callback, client) {
    // Apply filter
    songs.params['filter'] = filter;
    // Search songs
    doAction(songs, kodi_api_url, callback, client, function (json) {
        // No results
        if (!json.result.songs) {
            Avatar.speak("Je n'ai pas trouvé de résultats !", client, function () {
                Avatar.Speech.end(client);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            })
            return false;
        }
        nbsong = json.result.songs.length;
        // info (nbsong + ' chansons obtenues');

        // Clear playlist
        doAction(clearlist, kodi_api_url, function (resss) {
            json.result.songs.forEach(function (song) {
                addtolist.params.item.songid = song.songid;
                doAction(addtolist, kodi_api_url, function (resss) {
                    nbsong = nbsong - 1;
                    if (nbsong == 0)
                        //doAction(runlist, kodi_api_url, function (resss) {
                        //    info("Action KODI".yellow, "Démarrage de la playlist");
                        //});
                        doAction(runlist, kodi_api_url);
                });
            });
        });
        return true;
    });
}

var doRadio = function (radioid, name, kodi_api_url, client) {
    var xml = JSON.parse(xml_radio);
    xml.params.item.file = xml.params.item.file.replace(/radioid/, radioid);
    sendJSONRequest(kodi_api_url, xml, function (res) {
        if (res === false) Avatar.speak("Je n'ai pas réussi à mettre la radio !", client, function () {
            Avatar.Speech.end(client);
        })
        else {
            Avatar.speak("La radio " + name + " à été lancée.", client, function () {
                mode_control_kodi(kodi_api_url, '', client, ' ');
            })
        }
    });
}

/* CONTROL MODE KODI BY ASKME */

var mode_control_kodi = function (kodi_api_url, callback, client, tts) {

    Avatar.askme(tts, client,
        {
            "*": "",
            "quitter": "exit"
        }, 0, function (answer, end) {
            end(client, true);
            if (!answer) return mode_control_kodi(kodi_api_url, callback, client, 'Je n\'ai pas compris, recommence...');

            /* NAVIGATION DANS LES MENUS */

            else if ((answer.indexOf('menu') != -1) && (answer.indexOf('principal') != -1) || (answer.indexOf('accueil') != -1)) {
                params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "home" }, "id": 1 };
                doAction(params, kodi_api_url, callback);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf('menu') != -1) && (answer.indexOf('musique') != -1)) {
                if ((answer.indexOf('album') != -1) || (answer.indexOf('albums') != -1)) {
                    params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "music", "parameters": ["Albums"] }, "id": 1 };
                    doAction(params, kodi_api_url, callback);
                    mode_control_kodi(kodi_api_url, callback, client, ' ');
                }
                else if ((answer.indexOf('artists') != -1) || (answer.indexOf('artist') != -1)) {
                    params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "music", "parameters": ["Artists"] }, "id": 1 };
                    doAction(params, kodi_api_url, callback);
                    mode_control_kodi(kodi_api_url, callback, client, ' ');
                }
                else if ((answer.indexOf('single') != -1) || (answer.indexOf('singles') != -1)) {
                    params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "music", "parameters": ["Singles"] }, "id": 1 };
                    doAction(params, kodi_api_url, callback);
                    mode_control_kodi(kodi_api_url, callback, client, ' ');
                }
                else {
                    params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "music" }, "id": 1 };
                    doAction(params, kodi_api_url, callback);
                    mode_control_kodi(kodi_api_url, callback, client, ' ');
                }
            }
            else if ((answer.indexOf('menu') != -1) && (answer.indexOf('playlist') != -1) && (answer.indexOf('musique') != -1)) {
                params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "music", "parameters": ["special://profile/playlists/music/"] }, "id": 1 };
                doAction(params, kodi_api_url, callback);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf('menu') != -1) && (answer.indexOf('série') != -1)) {
                params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "videos", "parameters": ["TvShowTitles"] }, "id": 1 };
                doAction(params, kodi_api_url, callback);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf('menu') != -1) && (answer.indexOf('film') != -1)) {
                params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "videos", "parameters": ["MovieTitles"] }, "id": 1 };
                doAction(params, kodi_api_url, callback);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf('affiche') != -1) || (answer.indexOf('menu') != -1) && (answer.indexOf('météo') != -1)) {
                params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "weather" }, "id": 1 };
                doAction(params, kodi_api_url, callback);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }

            /* DEPLACEMENT DANS LES MENUS -- RIGHT-LEFT-UP-DOWN -- */

            else if (answer.indexOf("gauche") != -1) {
                doAction(Left, kodi_api_url);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if (answer.indexOf("droite") != -1) {
                doAction(Right, kodi_api_url);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf("monte") != -1) || (answer.indexOf("haut") != -1)) {
                doAction(Up, kodi_api_url);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf("descend") != -1) || (answer.indexOf("bas") != -1)) {
                doAction(Down, kodi_api_url);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if (answer.indexOf('retour') != -1) {
                params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "back" }, "id": 1 };
                doAction(params, kodi_api_url, callback);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf("sélectionner") != -1) || (answer.indexOf("valider") != -1) || (answer.indexOf("ok") != -1) || (answer.indexOf("entrer") != -1)) {
                doAction(Select, kodi_api_url);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf('affiche') != -1) && (answer.indexOf('contextuel') != -1)) {
                doAction(ContextMenu, kodi_api_url, callback);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf('affiche') != -1) && (answer.indexOf('info') != -1) || (answer.indexOf('infos') != -1) || (answer.indexOf('informations') != -1) || (answer.indexOf('information') != -1)) {
                params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "info" }, "id": 1 };
                doAction(params, kodi_api_url, callback);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }

            /* COMMANDES (PLAY-PAUSE-STOP-NEXT-PRECEDENT) */

            else if ((answer.indexOf("lire") != -1) || (answer.indexOf("lecture") != -1) || (answer.indexOf("play") != -1)) {
                doAction(Play, kodi_api_url)
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if (answer.indexOf("pause") != -1) {
                doAction(Pause, kodi_api_url);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf("stop") != -1) || (answer.indexOf("arrête") != -1) || (answer.indexOf("arrêtes") != -1)) {
                doAction(Stop, kodi_api_url);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf("suivant") != -1) || (answer.indexOf("suivante") != -1)) {
                doAction(Next, kodi_api_url);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf("précédent") != -1) || (answer.indexOf("précédente") != -1)) {
                    doAction(Prev, kodi_api_url);
                    mode_control_kodi(kodi_api_url, callback, client, ' ');
            }

            /* REGLAGE DU SON */

            else if (((answer.indexOf("coupes") != -1) || (answer.indexOf("désactives") != -1) || (answer.indexOf("coupe") != -1) || (answer.indexOf("désactive") != -1)) && ((answer.indexOf("volume") != -1) || (answer.indexOf("son") != -1))) {
                params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "mute" }, "id": 1 };
                doAction(params, kodi_api_url);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if (((answer.indexOf("remets") != -1) || (answer.indexOf("actives") != -1) || (answer.indexOf("remet") != -1) || (answer.indexOf("active") != -1)) && ((answer.indexOf("volume") != -1) || (answer.indexOf("son") != -1))) {
                params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "mute" }, "id": 1 };
                doAction(params, kodi_api_url);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if (((answer.indexOf("règles") != -1) || (answer.indexOf("règle") != -1) || (answer.indexOf("mets") != -1) || (answer.indexOf("met") != -1)) && ((answer.indexOf("volume") != -1) || (answer.indexOf("son") != -1))) {
                setVolume = answer.split(':')[1];
                /([0-9]+)/.exec(setVolume);
                var ValVolume = parseInt(RegExp.$1)
                set_Volume = { "jsonrpc": "2.0", "method": "Application.SetVolume", "params": { "volume": ValVolume }, "id": 1 };
                doAction(set_Volume, kodi_api_url);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }

            /* JOUE LA RADIO */

            else if (answer.indexOf('radio') != -1) {
                radio = answer.nettoyer();
                req_radio(radio, kodi_api_url, client);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }

            /* LECTURE DE LA MUSIQUE SELON (ARTISTE-TITRE-GENRE) */

            else if (answer.indexOf("artiste") != -1) {
                var artist = answer.nettoyer();
                var filter = { "and": [] };

                if (artist) {
                    filter.and.push({ "field": "artist", "operator": "contains", "value": artist });
                }
                doPlaylist(filter, kodi_api_url, callback, client);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }

            else if (answer.indexOf("titre") != -1) {
                var title = answer.nettoyer();
                var filter = { "and": [] };

                if (title) {
                    filter.and.push({ "field": "title", "operator": "contains", "value": title });
                }
                doPlaylist(filter, kodi_api_url, callback, client);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if (answer.indexOf("genre") != -1) {
                var genre = answer.nettoyer();
                var filter = { "and": [] };

                if (genre) {
                    filter.and.push({ "field": "genre", "operator": "contains", "value": genre });
                }
                doPlaylist(filter, kodi_api_url, callback, client);
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf('albums') != -1) || (answer.indexOf('album') != -1)) {
                var album = answer.nettoyer().toLowerCase();

               
                doAction(albums, kodi_api_url, callback, client, function (res) {
                    for (var i = 0; i < res.result.albums.length; i++) {
                        if (res.result.albums[i].label.toLowerCase() == album) {
                            var label = res.result.albums[i].label;
                            var albumid = res.result.albums[i].albumid;
                        }
                    }

                    var readalbum = { "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "albumid": albumid }, "options": { "resume": false } }, "id": 1 };

                    if (albumid) {
                        doAction(readalbum, kodi_api_url, callback, client);
                        mode_control_kodi(kodi_api_url, callback, client, ' ');
                    }
                    else {
                        Avatar.speak("Je n'ai pas trouvé l'album", client, function () {
                            end(client, true);
                            mode_control_kodi(kodi_api_url, callback, client, ' ');
                        });
                    }

                });

            }

            /* FILMS A VOIR */

            else if ((answer.indexOf('liste') != -1) && (answer.indexOf('non vu') != -1)) {

                doAction(unsetmovie, kodi_api_url, callback, client, function (res) {
                    var moviestosee = "";
                    if (res.result.limits.total == 0) {
                        Avatar.speak("Tu as déjà regardé tous les films.", client, function () {
                            end(client, true);
                            mode_control_kodi(kodi_api_url, callback, client, ' ');
                        });
                    }
                    else {
                        var moviestosee = "";
                        for (var i = 0; i < Math.min(5, res.result.limits.total); i++) { // 5=> nombre de films cités
                            if (moviestosee != "") { moviestosee += '. '; }
                            moviestosee += res.result.movies[Math.floor((Math.random() * (res.result.limits.total - 1)))].label
                        }
                        Avatar.speak('Il y à ' + res.result.limits.total + ' films qui n\'ont pas encore été vues. dont : ' + moviestosee, client, function () {
                            end(client, true);
                            mode_control_kodi(kodi_api_url, callback, client, ' ');
                        });
                    }
                });
            }

            /* LECTURE D'UN FILM SELON (TITRE) */

            else if ((answer.indexOf('regarder') != -1) || (answer.indexOf('voir') != -1) && (answer.indexOf("film") != -1)) {
                var fs = require('fs');

                var valfilm = answer.nettoyer();

                doAction(xml_film, kodi_api_url, callback, client, function (res) {
                    for (var i = 0; i < res.result.movies.length; i++) {
                        if (res.result.movies[i].label.toLowerCase() == valfilm.toLowerCase()) {
                            var label = res.result.movies[i].label;
                            var movieid = res.result.movies[i].movieid;
                        }
                    }

                    var readmovie = { "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "movieid": movieid }, "options": { "resume": false } }, "id": 1 };

                    if (movieid) {
                        doAction(readmovie, kodi_api_url, callback, client);
                        mode_control_kodi(kodi_api_url, callback, client, ' ');
                    }
                    else {
                        Avatar.speak("Je n'ai pas trouvé le film.", client, function () {
                            end(client, true);
                            mode_control_kodi(kodi_api_url, callback, client, ' ');
                        });
                    }

                });

            }

                /* MISE A JOUR DES LIBRAIRIES */

            else if ((answer.indexOf("update") != -1) || (answer.indexOf("médiathèque musique") != -1)) {
                doAction(AudioLibraryScan, kodi_api_url, callback, function () {
                    Avatar.speak("La médiathèque à été mis à jour.", client, function () {
                        end(client);
                    });
                });
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf("update") != -1) || (answer.indexOf("médiathèque vidéo") != -1)) {
                doAction(VideoLibraryScan, kodi_api_url, callback, function () {
                    Avatar.speak("La vidéothèque à été mis à jour.", client, function () {
                        end(client);
                        mode_control_kodi(kodi_api_url, callback, client, ' ');
                    });
                });
                mode_control_kodi(kodi_api_url, callback, client, ' ');
            }


            else if ((answer.indexOf('exit') != -1) || (answer.indexOf('to leave') != -1)) {
                Avatar.speak("J'ai quitter le mode multimédia", client, function () {
                    end(client, true);
                });
            }

            else {
                return mode_control_kodi(kodi_api_url, callback, client, 'Je n\'ai pas compris, recommence...');
            }

        });

}

var req_radio = function (radio, kodi_api_url, client) {

    var fs = require('fs');
    var xml2js = require('xml2js');
    var parser = new xml2js.Parser({ normalizeTags: true })

    fs.readFile(__dirname + '/xml/radios.xml', 'utf-8', function (err, data) {
        parser.parseString(data, function (err, result) {
            var noeudradio = result.radios.radio;

            for (var i = 0; i < noeudradio.length; i++) {
                var name, radioid;
                if (radio.toLowerCase() == noeudradio[i].$.name.toLowerCase()) {
                    name = noeudradio[i].$.name;
                    radioid = noeudradio[i].$.id;
                }
            }
            if (name) doRadio(radioid, name, kodi_api_url, client);
        });
    });
}

String.prototype.nettoyer = function () {
    var TERM = ['joues', 'joue', 'jouer', 'lances', 'lance', 'mets', 'met', 'écouter', 'rechercher', 'recherche', 'regarder', 'regardes', 'regarde', 'veux', 'souhaites', 'souhaite', 'lis', 'de', 'du', 'la', 'les', 'l\'', 'je', 'moi', 'artistes', 'artiste', 'titres', 'titre', 'musiques', 'musique', 'films', 'film', 'albums', 'album', 'genres', 'genre', 'singles', 'single', 'radios', 'radio', 'séries', 'série', 'tv', 'playlist'];
    var str = this;
    for (var i = 0; i < TERM.length; i++) {
        var reg= new RegExp('\\b'+TERM[i]+'\\b\\s?');
    	str = str.replace(reg, "").replace(':', '').trim();
    }
    return str;
};
