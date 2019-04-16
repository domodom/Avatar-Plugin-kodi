/* **********************************************************
 * Plugin kodi pour Avatar.IA
 * Permet de commander vocalement votre Media Center Kodi
 * Eddy TELLIER
 * Release Version : 1.0.0
 * Date Release : 23/08/2018
 * Version : 1.3.0
 ************************************************************
 */

var kodi = { } ;
kodi.status = { "status_video": {}, "status_music": {} };
kodi.status.status_video = { 'kodi': false, 'player': 'stop', 'episode': -1, 'file': "", 'label': "", 'season': -1, 'showtitle': "", 'title': "", 'type': "" };
kodi.status.status_music = { 'kodi': false, 'player': 'stop', 'artist': "", 'album': "", 'title': "", 'label': "", 'file': "" };

var mode_control = true;

exports.init = function () {
    let config = Config.modules.kodi;
    let kodi_api_url = 'http://' + config.ip_kodi + ':' + config.port_kodi + '/jsonrpc';
    status_kodi(kodi_api_url);
}

exports.cron = function (data, callback) {

    let config = Config.modules.kodi;
    let kodi_api_url = 'http://' + config.ip_kodi + ':' + config.port_kodi + '/jsonrpc';
    let client = data.client;
    status_kodi(kodi_api_url);

    if (Config.cron.kodi.enable == true) {
        if (kodi.status.status_music.kodi == false) start_kodi(client, config, kodi);
        setTimeout(function () {
            let type = Config.cron.kodi.type;
            let value = Config.cron.kodi.play_name;

            let filter = {"and": []};
            if (type == 'artiste') {
                filter.and.push({"field": "artist", "operator": "contains", "value": value});
            }
            doPlaylist(filter, kodi_api_url, callback, client);
            if (type == 'radio')
                req_radio(value, kodi_api_url, client);

            if ((type == 'album') || (type == 'albums')) {
                doAction(albums, kodi_api_url, callback, client, function (res) {
                    for (let i = 0; i < res.result.albums.length; i++) {
                        if (res.result.albums[i].label.toLowerCase() == value) {
                            var label = res.result.albums[i].label;
                            var album_id = res.result.albums[i].albumid;
                        }
                    }
                    let read_album = {
                        "jsonrpc": "2.0",
                        "method": "Player.Open",
                        "params": {"item": {"albumid": album_id}, "options": {"resume": false}},
                        "id": 1
                    };
                    if (album_id) {
                        doAction(read_album, kodi_api_url, callback, client);
                    }
                    else {
                        Avatar.speak("Je n'ai pas trouvé l'album", client, function () {
                        });
                    }
                });
            }
        }, 15000);
    }
};

exports.action = function(data, callback) {
  var config = Config.modules.kodi;
  var kodi_api_url = 'http://' + config.ip_kodi + ':' + config.port_kodi + '/jsonrpc';
  var client = data.client; // setClient(data);

  status_kodi(kodi_api_url);
//  navig_info(kodi_api_url, callback, client);

  var tblCommand = {
    start_kodi: function() {
      start_kodi(client, config, kodi);
    },
    close_kodi: function() {
      doAction(closekodi, kodi_api_url, callback, client);
      Avatar.speak("Le média-center à été fermé...", client, function() {
        Avatar.Speech.end(client);
      });
    },

    kodi_play: function() {
      if (kodi.status.status_music.kodi == true) {
        doAction(status, kodi_api_url, callback, client, function(res) {
          if ((res.result[0].playerid == 0) || (res.result[0].playerid == 1)) {
            let params = { "jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": res.result[0].playerid, "play": true }, "id": 1 };
            doAction(params, kodi_api_url, callback, client);
          }
        });
      }
    },

    kodi_pause: function() {
      if (kodi.status.status_music.kodi === true) {
        doAction(status, kodi_api_url, callback, client, function(res) {
          if ((res.result[0].playerid === 0) || (res.result[0].playerid === 1)) {
            var params = { "jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": res.result[0].playerid, "play": false }, "id": 1 };
            doAction(params, kodi_api_url, callback, client);
          }
        });
      }
    },
      play_radio: function() {
        mode_control = false;
        Avatar.askme('Quelle radio veux tu écouter ? ', client, {
            "*": "",
            "favorite": "fav"
        }, 0, function(answer, end) {
            end(client);
            let val_radio = answer.toLowerCase().replace(':', '').trim();
                if ((!answer) || (answer.indexOf('fav') != -1)) { req_radio(Config.modules.kodi.favorite_radio, kodi_api_url, client); }
                else req_radio(val_radio, kodi_api_url, client);
        });
    },
      play_music: function () {
          mode_control = false;
          Avatar.askme('Que souhaites tu écouter ? ', client, {
              "*": "",
              "favorite": "fav"
          }, 0, function(answer, end) {
              end(client);
              let value = answer.toLowerCase();
              let filter = { "and": [] };

              if ((value.indexOf('artiste') != -1) || (value.indexOf('lartiste') != -1)) {
                  value = answer.toLowerCase().supv().supm().supp();
                  filter.and.push({ "field": "artist", "operator": "contains", "value": value });
              }
              else if (value.indexOf('titre') != -1) {
                  value = answer.toLowerCase().supv().supm().supp();
                  filter.and.push({ "field": "artist", "operator": "contains", "value": value });
              }
              else if ((value.indexOf('albums') != -1) || (value.indexOf('album') != -1)) {
                  var reponse_album = answer.toLowerCase().supv().supm().supp();
                  doAction(albums, kodi_api_url, callback, client, function (res) {
                      for (let i = 0; i < res.result.albums.length; i++) {
                          if (res.result.albums[i].label.toLowerCase() == reponse_album) {
                              var label = res.result.albums[i].label;
                              var albumid = res.result.albums[i].albumid;
                          }
                      }
                      let readalbum = { "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "albumid": albumid }, "options": { "resume": false } }, "id": 1 };
                      if (albumid) {
                          Avatar.speak('Je lance l\'album ' + label, client, function () {
                              doAction(readalbum, kodi_api_url, callback, client);
                          });
                      }
                      else {
                          Avatar.speak("Je n'ai pas trouvé l'album", client, function () {
                          });
                      }
                  });
              }
              else {
                value = answer.toLowerCase().supv().supm().supp();
                filter.and.push({ "field": "artist", "operator": "contains", "value": value });
              }
              doPlaylist(filter, kodi_api_url, callback, client);
              Avatar.Speech.end(client);
          });
      },

      stop_player: function () {
        doAction(Stop, kodi_api_url);
              Avatar.Speech.end(client);
      },
      soundUp: function () {
        let repeter = 7;
          for (let i = 0; i < repeter; i++) {
              doAction(VolumeUp, kodi_api_url);
          }
        Avatar.Speech.end(client);
      },
      soundDown: function () {
          let repeter = 7;
          for (let i = 0; i < repeter; i++) {
              doAction(VolumeDown, kodi_api_url);
          }
          Avatar.Speech.end(client);
      },
      mute_unmute : function () {
        let params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "mute" }, "id": 1 };
        doAction(params, kodi_api_url);
            Avatar.Speech.end(client);
    },
      mode_mediacenter: function() {
      if ((kodi.status.status_music.kodi == true) || (kodi.status.status_video.kodi == true)) {
        navig_info(kodi_api_url, callback, client);
        mode_control_kodi(kodi, kodi_api_url, callback, client, "Mode multimédia activé. Que veux tu ?");
      } else {
        Avatar.askme('Le média-center n\'est pas lancé, veux tu le lancer ? ', client, {
          "oui": "yes",
          "ok": "yes",
          "vas y": "yes",
          "non": "no"
        }, 0, function(answer, end) {
          switch (answer) {
            case 'yes':
              end(client);
              start_kodi(client, config, kodi);
              break;
            default:
            case 'no':
              end(client);
              Avatar.speak("Le média-center n'à pas été lancé...", client, function() {
                Avatar.Speech.end(client);
              });
              break;
          }
        });
      }
    },
    pblv : function () {
      let params = { "jsonrpc": "2.0", "method": "Addons.ExecuteAddon", "params": { "wait": true, "addonid": "plugin.video.freplay", "params": {"param":"11","mode":"shows","channel":"france3"}}, "id":1};
      doAction(params, kodi_api_url);
      Avatar.speak("Je lance le dernier épisode trouvé !", client, function() {
          Avatar.Speech.end(client);
        });
        setTimeout(function () {
          params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": "firstpage"}, "id": 1 };
              doAction(params,  kodi_api_url);
        }, 2000);

        setTimeout(function () {
              doAction(Down,  kodi_api_url);
        }, 2000);
        setTimeout(function () {
              doAction(Select, kodi_api_url);
        }, 2000);


  }
  }

  info("kodi command:", data.action.command.yellow, "From:", data.client.yellow, "To:", client.yellow);
  tblCommand[data.action.command]();
  callback();
}


// -------------------------------------------
//  QUERIES KODI
//  Doc: https://kodi.wiki/view/JSON-RPC_API/v9
// -------------------------------------------

var json_film = { "jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "params": {}, "id": 1 }
var json_serie = {"jsonrpc": "2.0", "method": "VideoLibrary.GetTVShows", "params": {}, "id": 1}
var introspect = { "jsonrpc": "2.0", "method": "JSONRPC.Introspect", "params": { "filter": { "id": "AudioLibrary.GetSongs", "type": "method" } }, "id": 1 }
var Play = { "jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": 0, "play": true }, "id": 1 }
var Pause = { "jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": 0, "play": false }, "id": 1 }
var Stop = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "stop" }, "id": 1 }
var audioPlayer = { "jsonrpc": "2.0", "method": "Player.GetItem", "params": { "properties": ["title", "album", "artist", "duration", "file"], "playerid": 0 }, "id": "AudioGetItem" }
var videoPlayer = { "jsonrpc": "2.0", "method": "Player.GetItem", "params": { "properties": ["title", "album", "artist", "season", "episode", "duration", "showtitle", "tvshowid", "file"], "playerid": 1 }, "id": "VideoGetItem" }
var status = { "jsonrpc": "2.0", "method": "Player.GetActivePlayers", "id": 1 }
var playvideo = { "jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": 1 }, "id": 1 }
var Left = { "jsonrpc": "2.0", "method": "Input.Left", "params": {}, "id": 1 }
var Right = { "jsonrpc": "2.0", "method": "Input.Right", "params": {}, "id": 1 }
var Down = { "jsonrpc": "2.0", "method": "Input.Down", "params": {}, "id": 1 }
var Up = { "jsonrpc": "2.0", "method": "Input.Up", "params": {}, "id": 1 }
var VolumeUp = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "volumeup" }, "id": 1 }
var VolumeDown = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "volumedown" }, "id": 1 }
var Home = { "jsonrpc": "2.0", "method": "Input.Home", "params": {}, "id": 1 }
var Select = { "jsonrpc": "2.0", "method": "Input.Select", "params": {}, "id": 1 }
var Back = { "jsonrpc": "2.0", "method": "Input.Back", "params": {}, "id": 1 }
var Info = { "jsonrpc": "2.0", "method": "Input.Info", "params": {}, "id": 1 }
var ContextMenu = { "jsonrpc": "2.0", "method": "Input.ContextMenu", "params": {}, "id": 1 }
var ShowOSD = { "jsonrpc": "2.0", "method": "Input.ShowOSD", "params": {}, "id": 1 }
var VideoLibraryScan = { "jsonrpc": "2.0", "method": "VideoLibrary.Scan", "id": 1 }
var AudioLibraryScan = { "jsonrpc": "2.0", "method": "AudioLibrary.Scan", "id": 1 }
var Next = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "skipnext" }, "id": 1 }
var Prev = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "skipprevious" }, "id": 1 }
var genres = { "jsonrpc": "2.0", "method": "AudioLibrary.GetGenres", "params": { "properties": ["title"], "limits": { "start": 0, "end": 20 }, "sort": { "method": "label", "order": "ascending" } }, "id": "AudioLibrary.GetGenres" }
var albums = { "jsonrpc": "2.0", "method": "AudioLibrary.GetAlbums", "params": { "properties": ["artist", "artistid", "albumlabel", "year", "thumbnail", "genre"], "limits": { "start": 0, "end": 20 }, "sort": { "method": "label", "order": "ascending" } }, "id": "AudioLibrary.GetAlbumsByGenre" }
var songs = { "jsonrpc": "2.0", "method": "AudioLibrary.GetSongs", "params": { "properties": ["title", "genre", "artist", "duration", "album", "track"], "limits": { "start": 0, "end": 25 }, "sort": { "order": "ascending", "method": "track", "ignorearticle": true } }, "id": "libSongs" }
var saison = { "jsonrpc": "2.0", "method": "VideoLibrary.GetSeasons", "params": { "tvshowid": 1, "properties": ["season", "thumbnail"] }, "id": 1 }
var episode = { "jsonrpc": "2.0", "method": "VideoLibrary.GetEpisodes", "params": { "tvshowid": 1, "season": 1, "properties": ["title", "firstaired", "playcount", "runtime", "season", "episode", "file", "streamdetails", "lastplayed", "uniqueid"], "limits": { "start": 0, "end": 25 }, "sort": { "order": "ascending", "method": "track", "ignorearticle": true } }, "id": 1 }
var playlist = { "jsonrpc": "2.0", "method": "Playlist.GetItems", "params": { "properties": ["title", "album", "artist", "duration"], "playlistid": 0 }, "id": 1 }
var clearlist = { "jsonrpc": "2.0", "id": 0, "method": "Playlist.Clear", "params": { "playlistid": 0 } }
var addtolist = { "jsonrpc": "2.0", "id": 1, "method": "Playlist.Add", "params": { "playlistid": 0, "item": { "songid": 10 } } }
var runlist = { "jsonrpc": "2.0", "id": 2, "method": "Player.Open", "params": { "item": { "playlistid": 0 } } }
var getalbumsof = { "jsonrpc": "2.0", "method": "AudioLibrary.GetAlbums", "params": { "filter": { "operator": "is", "field": "artist", "value": "" } }, "id": 1 }
var playlistmusic = { "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "file": "" }, "options": { "shuffled": true } }, "id": 1 }
var playlistvideo = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "video", "parameters": [] }, "id": 1 }
var playserie = { "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "file": "" }, "options": { "resume": true } }, "id": 3 }
var films_recently = {"jsonrpc":"2.0","method":"GUI.ActivateWindow","params":{"window":"videos","parameters":["RecentlyAddedMovies"]},"id":1}
var radio = '{"jsonrpc":"2.0","method":"Player.Open","params":{"item":{"file":"plugin://plugin.audio.radio_de/station/radioid"}},"id":1}'
var unsetmovie = { "jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "params": { "filter": { "operator": "is", "field": "playcount", "value": "0" } }, "id": 1 }
var setsubtitle = { "jsonrpc": "2.0", "id": 1, "method": "Player.SetSubtitle", "params": { "playerid": 1, "subtitle": "" } }
var closekodi = { "jsonrpc": "2.0", "method": "Application.Quit", "id": "1" }


/* STATUS KODI */

var status_kodi = function (kodi_api_url) {

    // STATUS MUSIQUE
    var reqjson = { "jsonrpc": "2.0", "method": "Player.GetActivePlayers", "id": 1 };
    sendJSONRequest(kodi_api_url, reqjson, function (result) {
        if (result.id == 1) {
            kodi.status.status_music.kodi = true;
        }
        if (result.result) {
            if (result.result.length > 0)
                if (result.result[0].playerid == 0) {
                    reqjson = { "jsonrpc": "2.0", "id": 1, "method": "Player.GetProperties", "params": { "playerid": 0, "properties": ["speed"] } };
                    sendJSONRequest(kodi_api_url, reqjson, function (result) {
                        if (result.result.speed != 0) {
                            kodi.status.status_music.player = 'play';
                        }
                        else {
                            kodi.status.status_music.player = 'pause';
                        }
                    });
                    var reqjson = { "jsonrpc": "2.0", "method": "Player.GetItem", "params": { "properties": ["title", "album", "artist", "duration", "file"], "playerid": 0 }, "id": "AudioGetItem" }
                    sendJSONRequest(kodi_api_url, reqjson, function (json) {
                        kodi.status.status_music = { 'kodi': true, 'player': "play", 'artist': json.result.item.artist[0], 'album': json.result.item.album, 'title': json.result.item.title, 'label': json.result.item.label, 'file': json.result.item.file };
                    });

                }
        }
        else {
            kodi.status.status_music.kodi = false;
        }
    });

    // STATUS VIDEO
   var rqjson = { "jsonrpc": "2.0", "method": "Player.GetActivePlayers", "id": 1 };
    sendJSONRequest(kodi_api_url, rqjson, function (result) {
        if (result.id == 1) {
            kodi.status.status_video.kodi = true;
        }
        if (result.result) {
            if (result.result.length > 0)
                if (result.result[0].playerid == 1) {
                    rqjson = { "jsonrpc": "2.0", "id": 1, "method": "Player.GetProperties", "params": { "playerid": 1, "properties": ["speed"] } };
                    sendJSONRequest(kodi_api_url, rqjson, function (result) {
                        if (result.result.speed != 0) {
                            kodi.status.status_video.player = 'play';
                        }
                        else {
                            kodi.status.status_video.player = 'pause';
                        }
                    });
                    var rqjson = { "jsonrpc": "2.0", "method": "Player.GetItem", "params": { "properties": ["title", "album", "artist", "season", "episode", "duration", "showtitle", "tvshowid", "file"], "playerid": 1 }, "id": "VideoGetItem" }
                    sendJSONRequest(kodi_api_url, rqjson, function (json) {
                        kodi.status.status_video = { 'kodi': true, 'player': "play", 'type': json.result.item.type, 'title': json.result.item.title, 'file': json.result.item.file, 'label': json.result.item.label, 'showtitle': json.result.item.showtitle, 'season': json.result.item.season, 'episode': json.result.item.episode };
                    });
                }
        }
        else {
            kodi.status.status_video.kodi = false;
        }
    });
}

/* START KODI APPLICATION */

var start_kodi = function (client, config, kodi) {
    const execFile = require('child_process').execFile;

    execFile(config.path_kodi, function (err, stdout, stderr) {
                    if (err) {
                        Avatar.speak("Je n'ai pas pu lancé le média-center, vérifier la configuration", client, function () {
                            Avatar.Speech.end(client);
                        });
                        return;
                    }
    });

    Avatar.speak("Le média-center à été lancé.", client, function () {
        Avatar.Speech.end(client);
        kodi.status.status_music.kodi = true;
        kodi.status.status_video.kodi = true;
    });
}

var navig_info = function (kodi_api_url, callback, client) {
    var callback;
    var reponse = {};

    var params = { "jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentwindow"] }, "id": 1 };

    doAction(params, kodi_api_url, callback, client, function (res0) {
        reponse.currentwindow = { 'id': res0.result.currentwindow.id, 'name': res0.result.currentwindow.label };

        params = { "jsonrpc": "2.0", "method": "XBMC.GetInfoLabels", "params": { "labels": ["Container.Viewmode", "Container.NumItems", "Container.SortMethod", "System.CurrentWindow", "System.CurrentControl"] }, "id": 1 };
        doAction(params, kodi_api_url, callback, client, function (res) {
            container = {};
            if ((res.result["Container.NumItems"] != '') && (reponse.currentwindow.name != '')) {
                container.nb_items = parseInt(res.result["Container.NumItems"]);

            }

            else { container.nb_items = 0; }
            container.sortmethod = res.result['Container.SortMethod'];
            container.viewmode = res.result['Container.Viewmode'];
            navigation_viewmode_info(container);

            if ((container.nb_items != 0) && (container.nb_items <= 1000) && (reponse.currentwindow.name != '')) {

                listitem = [];
                for (var i = 0; i <= Math.round(container.nb_items / 2); i++) {
                    listitem.push("Container.ListItem(" + i + ").Label");
                }
                params = { "jsonrpc": "2.0", "method": "XBMC.GetInfoLabels", "params": { "labels": listitem }, "id": 1 };
                doAction(params, kodi_api_url, callback, client, function (res) {
                    temp_item = [];
                    temp_item_id = [];
                    for (var attributename in res.result) {
                        temp_item.push(res.result[attributename].toLowerCase());
                        temp_item_id.push(parseInt(attributename.match(/\d+/g).toString()));
                    }
                    listitem = [];
                    for (var i = (Math.round(container.nb_items / 2) + 1); i <= container.nb_items; i++) {
                        listitem.push("Container.ListItem(" + i + ").Label");
                    }
                    params = { "jsonrpc": "2.0", "method": "XBMC.GetInfoLabels", "params": { "labels": listitem }, "id": 1 };
                    doAction(params, kodi_api_url, '', client, function (res2) {

                        for (var attributename in res2.result) {
                            temp_item.push(res2.result[attributename].toLowerCase());
                            temp_item_id.push(parseInt(attributename.match(/\d+/g).toString()));
                        }

                        var item = [];
                        var item_id = [];
                        var index = 0;
                        var pos2point = 0;
                        if (temp_item.containers("..") >= 0) {
                            pos2point = temp_item_id[temp_item.containers("..")];
                        }
                        for (i = 0; i < temp_item_id.length; i++) {
                            if ((pos2point + index) < temp_item_id.length) {
                                item.push(temp_item[temp_item_id.containers(pos2point + index)]);
                            } else {
                                item.push(temp_item[temp_item_id.containers(pos2point + index - temp_item_id.length)]);
                            }
                            item_id.push(index);
                            index++;
                        }

                        container.items = item;
                        container.items_id = item_id;
                        reponse.container = container;
                        reponse.status = kodi.status;
                        kodi.container = reponse.container;
                      //  info (" ## Valeur de kodi : " + JSON.stringify(kodi));
                    });
                });
            }
            else {

                reponse.container = container;
                reponse.status = kodi.status;
                kodi.container = reponse.container;
            //    info ("Valeur de kodi : " + JSON.stringify(kodi));
            }
        });
    });
}

// fonction navigation viewmode
var navigation_viewmode_info = function (temp_data) {
    if (temp_data.way_normal) {
        delete temp_data.way_normal;                // sens normal de défilement (celui du scrolling et de la recherche)
        delete temp_data.way_reverse;               // sens inverse de défilement
        delete temp_data.way2_normal;               // sens normal de défilement pour le second axe d'un tableau
        delete temp_data.way2_reverse;              // sens inverse de défilement pour le second axe d'un tableau
        delete temp_data.way_options;               // sens pour atteindre le menu d'affichage
        delete temp_data.way_optionsback;           // sens pour quitter le menu d'affichage
        delete temp_data.first_col;
        delete temp_data.last_col;                  // le nombre de colonne du mode d'affichage
    }
    switch (temp_data.viewmode.toLowerCase()) {
        case 'galerie d\'affiches':
        case 'fanart':
            temp_data.way_normal = 'right';
            temp_data.way_reverse = 'left';
            temp_data.way2_normal = '';
            temp_data.way2_reverse = '';
            temp_data.way_options = 'up';
            temp_data.way_optionsback = 'right';
            temp_data.first_col = 1;
            temp_data.last_col = 1;
            break;
        case 'informations du média 2':
        case 'informations du média':
        case 'informations du média 3':
        case 'liste':
        case 'info':
        case 'grande liste':
            temp_data.way_normal = 'down';
            temp_data.way_reverse = 'up';
            temp_data.way2_normal = '';
            temp_data.way2_reverse = '';
            temp_data.way_options = 'left';
            temp_data.way_optionsback = 'right';
            temp_data.first_col = 1;
            temp_data.last_col = 1;
            break;
        case 'info 2':
        case 'large':
            temp_data.way_normal = 'down';
            temp_data.way_reverse = 'up';
            temp_data.way2_normal = 'right';
            temp_data.way2_reverse = 'left';
            temp_data.way_options = 'homeleft';
            temp_data.way_optionsback = 'right';
            temp_data.first_col = 1;
            temp_data.last_col = 2;
            break;
        case 'vignette':
            temp_data.way_normal = 'down';
            temp_data.way_reverse = 'up';
            temp_data.way2_normal = 'right';
            temp_data.way2_reverse = 'left';
            temp_data.way_options = 'homeleft';
            temp_data.way_optionsback = 'right';
            temp_data.first_col = 1;
            temp_data.last_col = 5;
            break;
        case '':
            break;
        default:
            temp_data.way_normal = false;
            temp_data.way_options = 'homeleft';
            break;
    }
}

var navigation_cherche_item = function (kodi_api_url, searchcontrol, callback, client) {
    var params = { "jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentcontrol"] }, "id": 1 };
    doAction(params, kodi_api_url, callback, client, function (res) {

         currentcontrol = res.result.currentcontrol.label.toLowerCase();
         lenstr = res.result.currentcontrol.label.length - 1;

        if ((currentcontrol.indexOf("[") == 0) && (currentcontrol.lastIndexOf("]") == lenstr)) {
            currentcontrol = res.result.currentcontrol.label.slice(1, lenstr);
        }

        if (kodi.container.items.containers(currentcontrol)!= -1) {

            if (kodi.container.last_col == 1) {
                positioncurrentcontrol = kodi.container.items_id[kodi.container.items.containers(currentcontrol)];
                positionsearchcontrol = kodi.container.items_id[kodi.container.items.containers(searchcontrol)];
                diffposition = positionsearchcontrol - positioncurrentcontrol;
                if (diffposition < 0) { diffposition += kodi.container.nb_items + 1 }
                if (diffposition >= ((kodi.container.nb_items) / 2)) {

                    repeter = kodi.container.nb_items - diffposition + 1;
                    searchdirection = kodi.container.way_reverse;
                }
                else {
                    repeter = diffposition;
                    searchdirection = kodi.container.way_normal;
                }

                params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": searchdirection }, "id": 1 };
                if (repeter > 0) {
                    for (var i = 0; i < repeter; i++) {
                        doAction(params, kodi_api_url);
                    }
                }
            }

            if (kodi.container.last_col > 1) {
                nb_col = kodi.container.last_col;

                positioncurrentcontrol = kodi.container.items_id[kodi.container.items.containers(currentcontrol)];
                positionsearchcontrol = kodi.container.items_id[kodi.container.items.containers(searchcontrol)];

                move_to_col = (positionsearchcontrol % nb_col) - (positioncurrentcontrol % nb_col);
                move_to_row = (Math.ceil((positionsearchcontrol + 1) / nb_col)) - (Math.ceil((positioncurrentcontrol + 1) / nb_col));

                if (move_to_col < 0) {
                    params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": kodi.container.way2_reverse }, "id": 1 };
                    for (var i = 0; i < Math.abs(move_to_col); i++) { doAction(params, kodi_api_url); }
                }
                if (move_to_row > 0) { params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": kodi.container.way_normal }, "id": 1 }; }
                if (move_to_row < 0) { params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": kodi.container.way_reverse }, "id": 1 }; }
                if (move_to_row != 0) {
                    for (var i = 0; i < Math.abs(move_to_row); i++) { doAction(params, kodi_api_url); }
                }
                if (move_to_col > 0) {
                    params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": kodi.container.way2_normal }, "id": 1 };
                    for (var i = 0; i < Math.abs(move_to_col); i++) { doAction(params, kodi_api_url); }
                }
            }
            if (callback) { callback(); }
        }
        else {
            Avatar.speak("La recherche n'a donné aucun resultat.", client, function () {
                Avatar.Speech.end(client);
            });
        }
    });
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
        return
    }
    if (res.error) {
        return
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
        if (callback) { callback({}) };
    });
}

var doPlaylist = function (filter, kodi_api_url, callback, client) {
    songs.params['filter'] = filter;
    doAction(songs, kodi_api_url, callback, client, function (json) {
        if (!json.result.songs) {
            Avatar.speak("Je n'ai pas trouvé de résultats !", client, function () {
                Avatar.Speech.end(client);
                mode_control_kodi('', kodi_api_url, callback, client, ' ');
            });
            return false;
        }
        nbsong = json.result.songs.length;

        doAction(clearlist, kodi_api_url, function (resss) {
            json.result.songs.forEach(function (song) {
                addtolist.params.item.songid = song.songid;
                doAction(addtolist, kodi_api_url, function (resss) {
                    nbsong = nbsong - 1;
                    if (nbsong == 0)
                        doAction(runlist, kodi_api_url);
                });
            });
        });
        return true;
    });
}

var doPlaylistSerie = function (id, kodi_api_url, callback, client) {
    var asyncEpisode = function (l_episode, reponse) {
        if (l_episode) {
            if (l_episode.playcount == 0) { return reponse(l_episode); }
            return asyncEpisode(les_episodes.shift(), reponse);
        }
        else { return reponse(false); }
    }
    var syncSaison = function (la_saison, reponse) {
        if (la_saison) {
            episode.params.season = parseInt(la_saison.season);
            sendJSONRequest(kodi_api_url, episode, function (res) {
                les_episodes = res.result.episodes;
                asyncEpisode(les_episodes.shift(), function (reponse_episode) {
                    if (reponse_episode == false) { return syncSaison(les_saisons.shift(), reponse); }
                    else { return reponse(reponse_episode); }
                });
            });
        }
        else { returnreponse(false); }
    }
    saison.params.tvshowid = parseInt(id);
    episode.params.tvshowid = parseInt(id);

    sendJSONRequest(kodi_api_url, saison, function (res) {
         les_saisons = res.result.seasons;
        syncSaison(les_saisons.shift(), function (reponse) {
            if (reponse == false) {
                Avatar.speak('Tous les épisodes ont été vu !', client, function () {
                    Avatar.Speech.end(client);
                    mode_control_kodi('', kodi_api_url, callback, client, ' ');
                });
            }
            else {

                playserie.params.item.file = reponse.file;
                doAction(playserie, kodi_api_url);
                Avatar.speak('lecture de l\'épisode ' + reponse.episode + ' de la saison ' + reponse.season + ".", client, function () {
                    Avatar.Speech.end(client);
                    if (Config.modules.kodi.exit_multimedia_after_play == false) mode_control_kodi('', kodi_api_url, callback, client, ' ');
                });
            }
        });
    });
}

var req_radio = function (radio, kodi_api_url, client) {

    var fs = require('fs');
    var xml2js = require('xml2js');
    var parser = new xml2js.Parser({ normalizeTags: true })

    fs.readFile(__dirname + '/xml/radios.xml', 'utf-8', function (err, data) {
        parser.parseString(data, function (err, result) {
            let noeudradio = result.radios.radio;
            let name, radioid = -1 ;
            for (let i = 0; i < noeudradio.length; i++) {
                if (radio.toLowerCase() == noeudradio[i].$.name.toLowerCase()) {
                    name = noeudradio[i].$.name;
                    radioid = noeudradio[i].$.id;
                }
            }
            if (radioid > -1) doRadio(radioid, name, kodi_api_url, client);
            else {
                Avatar.speak("Je n'ai pas trouvé la radio, je met la radio favorite.", client, function () {
                    Avatar.Speech.end(client);
                    return req_radio (Config.modules.kodi.favorite_radio, kodi_api_url, client);
                });
            }
            if ((Config.modules.kodi.exit_multimedia_after_play == false) && (mode_control == true)) mode_control_kodi(kodi, kodi_api_url, '', client, ' ');
        });
    });
}

var doRadio = function (radioid, name, kodi_api_url, client) {
    var xml = JSON.parse(radio);
    xml.params.item.file = xml.params.item.file.replace(/radioid/, radioid);
    sendJSONRequest(kodi_api_url, xml, function (res) {
        if (res === false)
            Avatar.speak("Je ne peux pas mettre cette radio !", client, function () {
            Avatar.Speech.end(client);
                if ((Config.modules.kodi.exit_multimedia_after_play == false) && (mode_control == true)) mode_control_kodi(kodi, kodi_api_url, '', client, ' ');
        });
        else {
            Avatar.speak("Tu écoutes maintenant la radio " + name, client, function () {
                Avatar.Speech.end(client);
                if ((Config.modules.kodi.exit_multimedia_after_play == false) && (mode_control == true)) mode_control_kodi(kodi, kodi_api_url, '', client, ' ');
            });
        }
    });
}

/* ASKME FOR SCROLLING */

function getUpDownScrolling(kodi_api_url, callback, tts, client) {
  Avatar.askme(tts, client, {
    "arrête": "done",
    "terminer": "done",
    "stop": "done"

  }, 0, function(answer, end) {
    switch (answer) {
      default:
      case 'done':
        end(client);
        if (typeof(kodi.scrolling) != "undefined") {
          info('plugin kodi - fin de scrolling!');
          delete kodi.scrolling;
        }
        mode_control_kodi('', kodi_api_url, callback, client, ' ');
        break;
    }
  });
}

var doScrolling = function (sens, kodi_api_url, callback, client) {
    if (typeof (kodi.scrolling) != "undefined") {
        delete kodi.scrolling;
        callback();
    }
    kodi.scrolling = "ON";

    let params = { "jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentcontrol"] }, "id": 1 };
    doAction(params, kodi_api_url, callback, client, function (res) {
        let currentcontrol = res.result.currentcontrol.label.toLowerCase();
        lenstr = res.result.currentcontrol.label.length - 1;
        if ((currentcontrol.indexOf("[") == 0) && (currentcontrol.lastIndexOf("]") == lenstr)) {
            currentcontrol = res.result.currentcontrol.label.slice(1, lenstr);
        }
        if (kodi.container.items.containers(currentcontrol) != -1) {
            let position_currentcontrol = kodi.container.items_id[kodi.container.items.containers(currentcontrol)];
            let max = Math.ceil((kodi.container.nb_items + 1) / kodi.container.last_col);
            doScroll(max, kodi_api_url, sens, function () {
                callback();
            });
        }
        else {
            Avatar.speak("Je n'ai pas pu effectuer le scrolling", client, function () {
                Avatar.Speech.end(client);
            });
            if (callback) callback();
        }
    });
}

function doScroll(max, kodi_api_url, sens, callback) {
    if (max <= 0) delete kodi.scrolling;
    if (kodi.scrolling == 'ON') {
        if (sens == "reverse") {
            let params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": kodi.container.way_reverse }, "id": 1 };
            doAction(params, kodi_api_url, null, null, function () {
                setTimeout(function () {
                    doScroll(--max, kodi_api_url, sens, callback);
                }, Config.modules.kodi.speed_scrolling);
            });
        }
        else {
            let params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": kodi.container.way_normal }, "id": 1 };
            doAction(params, kodi_api_url, null, null, function () {
                setTimeout(function () {
                    doScroll(--max, kodi_api_url, sens, callback);
                }, Config.modules.kodi.speed_scrolling);
            });
        }
    }
}

var setClient = function (data) {
    // client direct (la commande provient du client et est exécutée sur le client)
    var client = data.client;
    // Client spécifique fixe (la commande ne provient pas du client et n'est pas exécutée sur le client et ne peut pas changer)
    if (data.action.room)
        client = (data.action.room != 'current') ? data.action.room : (Avatar.currentRoom) ? Avatar.currentRoom : Config.default.client;
    // Client spécifique non fixe dans la commande HTTP (la commande ne provient pas du client et n'est pas exécutée sur le client et peut changer
    if (data.action.setRoom)
        client = data.action.setRoom;
    return client;
}

/* MODE MULTIMEDIA - CONTROL KODI BY ASKME */

var mode_control_kodi = function (kodi, kodi_api_url, callback, client, tts) {

    navig_info(kodi_api_url, callback, client);

    Avatar.askme(tts, client,
        { "*": "","quitter": "exit"}, 0, function (answer, end) {
            end(client);
            var params;

            if (!answer) return mode_control_kodi(kodi, kodi_api_url, callback, client, 'Je n\'ai pas compris, recommence...');

            /* NAVIGATION DANS LES MENUS */

            else if ((answer.indexOf('menu') != -1) || (answer.indexOf('menu') != -1)) {
                if ((answer.indexOf('principal') != -1) || (answer.indexOf('accueil') != -1)) {
                    params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "home" }, "id": 1 };
                    doAction(params, kodi_api_url, callback);
                    mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                }
                else if ((answer.indexOf('séries') != -1) || (answer.indexOf('série') != -1)) {
                    params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "videos", "parameters": ["TvShowTitles"] }, "id": 1 };
                    doAction(params, kodi_api_url, callback);
                    mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                }
                else if ((answer.indexOf('films') != -1) || (answer.indexOf('film') != -1)) {
                    params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "videos", "parameters": ["MovieTitles"] }, "id": 1 };
                    doAction(params, kodi_api_url, callback);
                    mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                }
                else if (answer.indexOf('météo') != -1) {
                    params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "weather" }, "id": 1 };
                    doAction(params, kodi_api_url, callback);
                    mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                }
                else if ((answer.indexOf('photos') != -1) || (answer.indexOf('images') != -1) || (answer.indexOf('photo') != -1) || (answer.indexOf('image') != -1)) {
                    params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "pictures", "parameters": ["MovieTitles"] }, "id": 1 };
                    doAction(params, kodi_api_url, callback);
                    mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                }
                else if ((answer.indexOf('musiques') != -1) || (answer.indexOf('musique')) != -1) {
                    if ((answer.indexOf('album') != -1) || (answer.indexOf('albums') != -1)) {
                        params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "music", "parameters": ["Albums"] }, "id": 1 };
                        doAction(params, kodi_api_url, callback);
                        mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                    }
                    else if ((answer.indexOf('artists') != -1) || (answer.indexOf('artist') != -1)) {
                        params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "music", "parameters": ["Artists"] }, "id": 1 };
                        doAction(params, kodi_api_url, callback);
                        mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                    }
                    else if ((answer.indexOf('singles') != -1) || (answer.indexOf('single') != -1)) {
                        params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "music", "parameters": ["Singles"] }, "id": 1 };
                        doAction(params, kodi_api_url, callback);
                        mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                    }
                    else if ((answer.indexOf('albums') != -1) || (answer.indexOf('album') != -1)) {
                        params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "music", "parameters": ["Albums"] }, "id": 1 };
                        doAction(params, kodi_api_url, callback);
                        mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                    }
                    else if ((answer.indexOf('genres') != -1) || (answer.indexOf('genre') != -1)) {
                        params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "music", "parameters": ["Genres"] }, "id": 1 };
                        doAction(params, kodi_api_url, callback);
                        mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                    }
                    else {
                        params = { "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": { "window": "music" }, "id": 1 };
                        doAction(params, kodi_api_url, callback);
                        mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                    }
                }
                else { mode_control_kodi(kodi, kodi_api_url, callback, client, 'Je n\'ai pas compris, recommence.') } ;
            }

            /* DEPLACEMENT DANS LES MENUS -- RIGHT-LEFT-UP-DOWN -- */

            else if (answer.indexOf("gauche") != -1) {
                doAction(Left, kodi_api_url);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if (answer.indexOf("droite") != -1) {
                doAction(Right, kodi_api_url);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf("monte") != -1) || (answer.indexOf("haut") != -1)) {
                doAction(Up, kodi_api_url);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf("descend") != -1) || (answer.indexOf("bas") != -1)) {
                doAction(Down, kodi_api_url);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if (answer.indexOf('retour') != -1) {
                params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "back" }, "id": 1 };
                doAction(params, kodi_api_url, callback);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf("sélectionner") != -1) || (answer.indexOf("valider") != -1) || (answer.indexOf("ok") != -1) || (answer.indexOf("entrer") != -1)) {
                doAction(Select, kodi_api_url);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf('affiche') != -1) && (answer.indexOf('contextuel') != -1)) {
                doAction(ContextMenu, kodi_api_url, callback);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf('affiche') != -1) && (answer.indexOf('info') != -1) || (answer.indexOf('infos') != -1) || (answer.indexOf('informations') != -1) || (answer.indexOf('information') != -1)) {
                params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "info" }, "id": 1 };
                doAction(params, kodi_api_url, callback);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }

            /* COMMANDES (AFFICHE LECTEUR-PLAY-PAUSE-STOP-NEXT-PRECEDENT-AVANCE-RECUL) */

            else if ((answer.indexOf('affiche') != -1) || (answer.indexOf('masque') != -1) && (answer.indexOf('lecteur') != -1) || (answer.indexOf('player') != -1)) {
                doAction(ShowOSD, kodi_api_url);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }

            else if ((answer.indexOf("lire") != -1) || (answer.indexOf("lecture") != -1) || (answer.indexOf("play") != -1)) {
                    doAction(Play, kodi_api_url);
                if (Config.modules.kodi.exit_multimedia_after_play == false) mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if (answer.indexOf("pause") != -1) {
              if (kodi.status_kodi.status_music.kodi == true) {
                params = { "jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": 0, "play": false }, "id": 1 };
                doAction(params, kodi_api_url);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
              }
              if (kodi.status_kodi.status_video.kodi == true) {
                params = { "jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": 1, "play": false }, "id": 1 };
                doAction(params, kodi_api_url);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
          }
            else if ((answer.indexOf("stop") != -1) || (answer.indexOf("arrête") != -1) || (answer.indexOf("arrêtes") != -1)) {
                doAction(Stop, kodi_api_url);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf("suivant") != -1) || (answer.indexOf("suivante") != -1)) {
                doAction(Next, kodi_api_url);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf("précédent") != -1) || (answer.indexOf("précédente") != -1)) {
              for (var i = 0; i < 2; i++) {
                doAction(Prev, kodi_api_url);
              }
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if (answer.indexOf('avance') != -1) {
                params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "stepforward" }, "id": 1 };
                var number = answer.split(':')[1];
                /([0-9]+)/.exec(number);
                repeter = parseInt(RegExp.$1);
                if (!repeter) repeter = 1;
                    for (var i = 0; i < repeter; i++) {
                        doAction(params, kodi_api_url);
                    }
                    mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf('recul') != -1) || (answer.indexOf('retour en arrière') != -1)) {
                params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "stepback" }, "id": 1 };
                var number = answer.split(':')[1];
                /([0-9]+)/.exec(number);
                repeter = parseInt(RegExp.$1);
                if (!repeter) repeter = 1;
                for (var i = 0; i < repeter; i++) {
                    doAction(params, kodi_api_url);
                }
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }


            /* SCROLLING */

            else if ((answer.indexOf('scrolling') != -1) || (answer.indexOf('défile') != -1)) {
                if ((answer.indexOf('inverse') != -1) || (answer.indexOf('arrière') != -1)) {
                    doScrolling("reverse", kodi_api_url, callback, client);
                    getUpDownScrolling(kodi_api_url, callback, ' ', client);
                }
                else {
                    doScrolling("normal", kodi_api_url, callback, client);
                    getUpDownScrolling(kodi_api_url, callback, ' ', client);
                }
            }

            /* EXECUTER ADDON */

            else if ((answer.indexOf('freeplay') != -1) || (answer.indexOf('free play') != -1)) {
              let addon = "plugin.video.freplay" ;
              let param = { "jsonrpc": "2.0", "method": "Addons.ExecuteAddon", "params": { "wait": false, "addonid": addon, "params": ["null"]}, "id":0};
                doAction(param, kodi_api_url);
            }

            /* REGLAGE DU SON */

            else if (((answer.indexOf("coupes") != -1) || (answer.indexOf("désactives") != -1) || (answer.indexOf("coupe") != -1) || (answer.indexOf("désactive") != -1)) && ((answer.indexOf("volume") != -1) || (answer.indexOf("son") != -1))) {
                params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "mute" }, "id": 1 };
                doAction(params, kodi_api_url);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if (((answer.indexOf("remets") != -1) || (answer.indexOf("actives") != -1) || (answer.indexOf("remet") != -1) || (answer.indexOf("active") != -1)) && ((answer.indexOf("volume") != -1) || (answer.indexOf("son") != -1))) {
                params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": { "action": "mute" }, "id": 1 };
                doAction(params, kodi_api_url);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if (((answer.indexOf("règles") != -1) || (answer.indexOf("règle") != -1) || (answer.indexOf("mets") != -1) || (answer.indexOf("met") != -1)) && ((answer.indexOf("volume") != -1) || (answer.indexOf("son") != -1))) {
                var setVolume = answer.split(':')[1];
                /([0-9]+)/.exec(setVolume);
                var ValVolume = parseInt(RegExp.$1)
                var set_Volume = { "jsonrpc": "2.0", "method": "Application.SetVolume", "params": { "volume": ValVolume }, "id": 1 };
                doAction(set_Volume, kodi_api_url);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }

            /* JOUE LA RADIO */

            else if (answer.indexOf('radio') != -1) {
                val_radio = answer.toLowerCase().supv().supm().supp();
                req_radio(val_radio, kodi_api_url, client);
            }

            /* LECTURE DE LA MUSIQUE SELON (ARTISTE-TITRE-GENRE - ALBUM) */

            else if (answer.indexOf("artiste") != -1) {
                var artist = answer.toLowerCase().supv().supm().supp();
                var filter = { "and": [] };

                if (artist) {
                    filter.and.push({ "field": "artist", "operator": "contains", "value": artist });
                }
                doPlaylist(filter, kodi_api_url, callback, client);
                if (Config.modules.kodi.exit_multimedia_after_play == false) mode_control_kodi(kodi, kodi_api_url, '', client, ' ');
            }

            else if (answer.indexOf("titre") != -1) {
                var title = answer.toLowerCase().supv().supm().supp();
                var filter = { "and": [] };
                if (title) {
                    filter.and.push({ "field": "title", "operator": "contains", "value": title });
                }
                doPlaylist(filter, kodi_api_url, callback, client);
                if (Config.modules.kodi.exit_multimedia_after_play == false) mode_control_kodi(kodi, kodi_api_url, '', client, ' ');
            }
            else if (answer.indexOf("genre") != -1) {
                var genre = answer.toLowerCase().supv().supm().supp();
                var filter = { "and": [] };

                if (genre) {
                    filter.and.push({ "field": "genre", "operator": "contains", "value": genre });
                }
                doPlaylist(filter, kodi_api_url, callback, client);
                if (Config.modules.kodi.exit_multimedia_after_play == false) mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
            }
            else if ((answer.indexOf('albums') != -1) || (answer.indexOf('album') != -1)) {
                    var reponse_album = answer.toLowerCase().supv().supm().supp();
                    reponse_album.replace("écouter","");
                doAction(albums, kodi_api_url, callback, client, function (res) {
                    for (var i = 0; i < res.result.albums.length; i++) {
                        if (res.result.albums[i].label.toLowerCase() == reponse_album) {
                            var label = res.result.albums[i].label;
                            var albumid = res.result.albums[i].albumid;
                        }
                    }
                    var readalbum = { "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "albumid": albumid }, "options": { "resume": false } }, "id": 1 };
                    if (albumid) {
                        Avatar.speak('Tu écoutes l\'album ' + label, client, function () {
                            Avatar.Speech.end(client);
                            doAction(readalbum, kodi_api_url, callback, client);
                            if (Config.modules.kodi.exit_multimedia_after_play == false) mode_control_kodi(kodi, kodi_api_url, '', client, ' ');
                        });
                    }
                    else {
                        Avatar.speak("Je n'ai pas trouvé l'album", client, function () {
                            Avatar.Speech.end(client);
                            mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                        });
                    }
                });
            }

            /* LECTURE D'UNE SERIE (TITRE) + FILM PAR TITRE */

            else if ((answer.indexOf('regarder') != -1) || (answer.indexOf('voir') != -1)) {
                if (answer.indexOf("série") != -1) {
                    var ask_serie = answer.toLowerCase().supv().supm().supp();
                    doAction(json_serie, kodi_api_url, callback, client, function (res) {
                        let tvshowid = -1;
                        for (var i = 0; i < res.result.tvshows.length; i++) {

                            if (res.result.tvshows[i].label.toLowerCase() == ask_serie) {
                                label = res.result.tvshows[i].label;
                                tvshowid = res.result.tvshows[i].tvshowid;
                            }
                        }
                        if (tvshowid > -1) {
                            doPlaylistSerie(tvshowid, kodi_api_url, callback, client);
                            if (Config.modules.kodi.exit_multimedia_after_play == false) mode_control_kodi(' ', kodi_api_url, '', client, ' ');
                        }
                        else {
                            Avatar.speak("Je n'ai pas trouvé la série.", client, function () {
                                Avatar.Speech.end(client);
                                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                            });
                        }
                    });
                }

                if (answer.indexOf("film") != -1) {
                    var valfilm = answer.toLowerCase().supv().supm().supp();
                    doAction(json_film, kodi_api_url, callback, client, function (res) {
                        for (var i = 0; i < res.result.movies.length; i++) {
                            if (res.result.movies[i].label.toLowerCase() == valfilm.toLowerCase()) {
                                var label = res.result.movies[i].label;
                                var movieid = res.result.movies[i].movieid;
                            }
                        }

                        var readmovie = { "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "movieid": movieid }, "options": { "resume": false } }, "id": 1 };

                        if (movieid) {
                            doAction(readmovie, kodi_api_url, callback, client);
                            Avatar.speak("Tu regardes le film : " + label, client, function () {
                                Avatar.Speech.end(client);
                                if (Config.modules.kodi.exit_multimedia_after_play == false) mode_control_kodi(' ', kodi_api_url, '', client, ' ');
                            });
                        }
                        else {
                            Avatar.speak("Je n'ai pas trouvé le film " + valfilm + ".", client, function () {
                                Avatar.Speech.end(client);
                                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                            });
                        }
                    });
                }
            }

            /* FILMS A VOIR ET AJOUTE RECEMMENT */

            else if ((answer.indexOf('liste') != -1) && (answer.indexOf('film') != -1)) {
                    if (answer.indexOf('non vu') != -1) {
                doAction(unsetmovie, kodi_api_url, callback, client, function (res) {
                    var moviestosee = "";
                    if (res.result.limits.total == 0) {
                        Avatar.speak("Tous les films ont déjà été visionnés.", client, function () {
                            Avatar.Speech.end(client);
                        });
                    }
                    else {
                        var moviestosee = "";
                        for (var i = 0; i < Math.min(5, res.result.limits.total); i++) {
                            if (moviestosee != "") { moviestosee += '. '; }
                            moviestosee += res.result.movies[Math.floor((Math.random() * (res.result.limits.total - 1)))].label
                        }
                        Avatar.speak('Il y à ' + res.result.limits.total + ' films qui n\'ont pas encore été visionnés. ' + moviestosee, client, function () {
                            Avatar.Speech.end(client);
                            mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                        });
                    }
                });
              }
              if (answer.indexOf('dernier ajouté') != -1) {
                  doAction(films_recently,kodi_api_url);
                  mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
              }
              else {
                  Avatar.speak("Je n'ai pas trouvé ce que tu recherches !", client, function () {
                      Avatar.Speech.end(client);
                      mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                  });
              }
            }

            /* RECHERCHE ITEM */

            else if ((answer.indexOf('affiche') != -1) || (answer.indexOf('recherches') != -1) || (answer.indexOf('recherche') != -1)) {
                var choice = answer.toLowerCase().rechercher();
                if (choice) {
                    navigation_cherche_item(kodi_api_url, choice, callback, client);
                    mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                }
                else {
                    Avatar.speak("Je n'ai pas trouvé ce que tu recherches !", client, function () {
                        Avatar.Speech.end(client);
                        mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                    });
                }
            }

            /* VIEWMODE (FANART-VIGNETTES-LISTE) */

            else if ((answer.indexOf("affichage") != -1) || (answer.indexOf("viewmode") != -1)) {
              navig_info(kodi_api_url, callback, client);
              var type_affichage = answer.toLowerCase().view();
              if (type_affichage == "fan art") type_affichage = "fanart"; if (type_affichage == "miniature") type_affichage = "miniatures";

              var index=0;
              var maxindex=12;
              var change_viewmode = function (search_viewmode, viewmode_found, reponse){
                if (index==0) {
                  // bouge à gauche ou haut pour faire apparaitre le menu laterale
                  if ((kodi.container.way_options == 'left')||(kodi.container.way_options == 'up')) {
                  params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": kodi.container.way_options}, "id": 1 };
                      doAction(params, kodi_api_url);
                  }
                  if (kodi.container.way_options=='homeleft') {
                    params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": "firstpage"}, "id": 1 };
                        doAction(params, kodi_api_url);
                    params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": "left"}, "id": 1 };
                    doAction(params, kodi_api_url);
                  }

                  setTimeout(function(){index++; return change_viewmode(search_viewmode, false, reponse);},200);
                }
                else if ((viewmode_found==false) && (index!=0)) {
                  doAction(Select, kodi_api_url, callback, client, function(res){
                    setTimeout(function(){
                    par={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentcontrol"]}, "id": 1}
                    doAction(par, kodi_api_url, callback, client, function(res){
                      if (search_viewmode.toLowerCase()=='next') {search_viewmode=res.result.currentcontrol.label.slice(6,res.result.currentcontrol.label.length);}
                      if ((res.result.currentcontrol.label.toLowerCase()==('view: '+search_viewmode.toLowerCase()))||(index>=maxindex))  {
                          return change_viewmode(search_viewmode, true, reponse);
                        }
                        else {
                          return change_viewmode(search_viewmode, false, reponse);
                        }
                    });
                  }, 200);
                    index++;
                  });
                }
                else if (viewmode_found==true) {
                  if (index >= maxindex) {
                    Avatar.speak('Je n\'ai pas trouvé la vue demandée', client, function() {
                      Avatar.Speech.end(client);
                      mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                    });
                    return reponse(false);}
                    delete kodi.container.viemode;
                    kodi.container.viewmode = search_viewmode;
                    navigation_viewmode_info(kodi.container);
                  if (kodi.container.way_optionsback) {
                    params = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": kodi.container.way_optionsback}, "id": 1 };
                    doAction(params, kodi_api_url,callback, function(res){
                      return reponse(true);
                    });
                  }
                  else {
                    return reponse(true);}
                }
              }

              if ((type_affichage == "fanart") || (type_affichage == "miniatures") || (type_affichage == "liste") || (type_affichage == "grande liste")) {
                var previouscurrentcontrol='';
                  par={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentcontrol"]}, "id": 1};
                  doAction(par, kodi_api_url, callback, client, function(res){
                    if (res.result.currentcontrol.label == "" ) {
                      param = { "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": "up"}, "id": 1 };
                      doAction(param, kodi_api_url);
                    }
                    previouscurrentcontrol=res.result.currentcontrol.label;
                    lenstr=res.result.currentcontrol.label.length-1;
                    if  ((previouscurrentcontrol.indexOf("[")==0)&&(previouscurrentcontrol.lastIndexOf("]")==lenstr)) {
                      previouscurrentcontrol=res.result.currentcontrol.label.slice(1,lenstr);
                    }
                  });
                change_viewmode(type_affichage, false, function (reponse) {
                  if ((reponse==true) && (previouscurrentcontrol!='')) {
                  setTimeout(function(){ navigation_cherche_item(previouscurrentcontrol);}, 700);
                  }
                });
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
              }
              else {
                Avatar.speak('Je ne peux pas mettre la vue demandée', client, function() {
                Avatar.Speech.end(client);
                mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
              });}
            }

            /* MISE A JOUR DES LIBRAIRIES */

            else if ((answer.indexOf("update") != -1) || (answer.indexOf("mets à jour") != -1) && (answer.indexOf("médiathèque musique") != -1)) {
                doAction(AudioLibraryScan, kodi_api_url, callback, client, function () {
                    Avatar.speak("La médiathèque à été mis à jour.", client, function () {
                        Avatar.Speech.end(client);
                        mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                    });
                });
            }
            else if ((answer.indexOf("update") != -1) || (answer.indexOf("mets à jour") != -1) && (answer.indexOf("médiathèque vidéo") != -1)) {
                doAction(VideoLibraryScan, kodi_api_url, callback, client, function () {
                    Avatar.speak("La vidéothèque à été mis à jour.", client, function () {
                        Avatar.Speech.end(client);
                        mode_control_kodi(kodi, kodi_api_url, callback, client, ' ');
                    });
                });
            }

            else if ((answer.indexOf('exit') != -1) || (answer.indexOf('to leave') != -1)) {
                Avatar.speak("J'ai quitté le mode multimédia", client, function () {
                    Avatar.Speech.end(client);
                });
            }

           else { mode_control_kodi(kodi, kodi_api_url, callback, client, 'Je n\'ai pas compris, recommence.') };

        });
}

String.prototype.supv = function () {
    let TERM = [ "écouter", "joues", "joue", "jouer", "lances", "lance", "mets", "met", "rechercher", "recherche", "regarder", "regardes", "regarde", "veux", "souhaites", "souhaite", "affiches", "affiche", "lis" ];
    let str = this;
    for (let i = 0; i < TERM.length; i++) {
         let reg= new RegExp(TERM[i], "gi");
        //var reg = new RegExp('\\b' + TERM[i] + '\\b\\s?');
        str = str.replace(reg, "").replace(':', '').trim();
    }
    return str;
};

String.prototype.supm = function () {
    let TERM = [ "artistes", "lartiste", "artiste", "titres", "titre", "musiques", "musique", "films", "film", "l'album", "albums", "album", "genres", "genre", "singles", "single", "radios", "radio", "séries", "série", "tv", "playlist" ];
    let str = this;
    for (let i = 0; i < TERM.length; i++) {
         let reg = new RegExp('\\b' + TERM[i] + '\\b\\s?');
        str = str.replace(reg, "").replace(':', '').trim();
    }
    return str;
};

String.prototype.supp = function () {
    let TERM = ["de", "du", "la", "les", "l\"", "le", "je", "moi"];
    let str = this;
    for (let i = 0; i < TERM.length; i++) {
         let reg= new RegExp(TERM[i] + " ", "gi");
        str = str.replace(reg, "").replace(':', '').trim();
    }
    return str;
};

String.prototype.rechercher = function () {
    let TERM = ['affiches', 'affiche', 'recherches', 'recherche'];
    let str = this;
    for (let i = 0; i < TERM.length; i++) {
         let reg = new RegExp('\\b' + TERM[i] + '\\b\\s?');
         str = str.replace(reg, "").replace(':', '').trim();
    }
    return str;
};

String.prototype.view = function () {
    let TERM = ['affichage', 'en', 'mode', 'viewmode'];
    let str = this;
    for (let i = 0; i < TERM.length; i++) {
         let reg = new RegExp('\\b' + TERM[i] + '\\b\\s?');
        str = str.replace(reg, "").replace(':', '').trim();
    }
    return str;
};

Array.prototype.containers = function (obj) {
    var i = this.length;
    while (i--) { if (this[i] == obj) { return (i); } }
    return -1;
};
