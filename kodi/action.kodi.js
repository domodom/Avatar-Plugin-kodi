'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _helpers = require('../../node_modules/ava-ia/lib/helpers');
var _ = require('underscore');

exports.default = function (state) {
    return new Promise(function (resolve, reject) {

        //info('***** NLP Relations ****'.yellow);
        //info('state.tokens:', state.tokens);
        //info('state.tags:', state.tags);
        //for (var a in state.relations) {
        //    info('Relations', a, ":", state.relations[a])
        //}
        //info('********** END *********'.yellow);  

        /* pour la pièce en multiroom */
        var room = Avatar.ia.clientFromRule(state.rawSentence);

        for (var rule in Config.modules.kodi.rules) {
            var match = (0, _helpers.syntax)(state.sentence, Config.modules.kodi.rules[rule]);
            if (match) break;
        }

        if (state.debug) info('ActionMediacenter'.bold.yellow, rule.yellow);

        setTimeout(function () {
            state.action = {
                module: 'kodi',
                command: rule,
                room: room,
                sentence: state.rawSentence
            };
            resolve(state);
        }, 500);
    });
};



