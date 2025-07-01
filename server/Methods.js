
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import { fetchCertificate } from './OAuthEndpoints';

let log = console.log;

Meteor.methods({
    getAsset: async function (path) {
        let file = await Assets.getTextAsync(path);
        return file;
    },
    fetchCertificate: async function (url) {
        fetchCertificate(url);
    }
});
