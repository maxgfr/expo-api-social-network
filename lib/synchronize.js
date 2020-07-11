import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as Google from 'expo-google-app-auth';
import TwitchClient from 'twitch';

import {
  TWITCH_CLIENT_ID,
  TWITCH_SECRET_ID,
  INSTAGRAM_CLIENT_ID,
  INSTAGRAM_SECRET,
  YOUTUBE_KEY,
  EXPO_SCHEME,
  EXPO_USERNAME,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID
} from 'react-native-dotenv'

const URL_REDIRECT = AuthSession.getRedirectUrl(); // "https://auth.expo.io/@"+EXPO_USERNAME+"/"+EXPO_SCHEME

const TWITCH_HELIX_BASE_URL="https://api.twitch.tv/helix";
const TWITCH_OAUTH_URL="https://id.twitch.tv/oauth2/authorize";
const TWITCH_OAUTH_URL_SERVER="https://id.twitch.tv/oauth2/token";
const TWITCH_SCOPES = "user:read:broadcast+user:read:email";
const TWITCH_ACCEPT = "application/vnd.twitchtv.v5+json";

const INSTAGRAM_BASE_URL="https://graph.instagram.com";
const INSTAGRAM_OAUTH_URL="https://api.instagram.com/oauth/authorize";
const INSTAGRAM_OAUTH_URL_SERVER="https://api.instagram.com/oauth/access_token";
const INSTAGRAM_SCOPES="user_profile,user_media";
const INSTAGRAM_MAX_RESULT = "20";

const YOUTUBE_SCOPES="https://www.googleapis.com/auth/youtube.readonly";
const YOUTUBE_BASE_URL="https://www.googleapis.com/youtube/v3";
const YOUTUBE_PART_CHANNELS = "snippet%2CcontentDetails%2Cstatistics";
const YOUTUBE_PART_PLAYLIST = "snippet%2CcontentDetails";
const YOUTUBE_MAX_RESULT = "50";

export class Synchronize {

    static myInstance = null;

    static getInstance() {
        if (Synchronize.myInstance == null) {
            Synchronize.myInstance = new Synchronize();
        }
        return this.myInstance;
    }

    constructor() {
      const expoScheme = EXPO_SCHEME+"://"
      this.redirectUrl = Linking.makeUrl();
      if (this.redirectUrl.startsWith('exp://1')) {
        this.redirectUrl = this.redirectUrl + '/--/';
      } else if (this.redirectUrl != expoScheme) {
        this.redirectUrl = redirectUrl + '/'
      }
    }

    /* Twitch */

    getTwitchToken() {
      return new Promise(async (resolve, reject) => {
        try {
          // console.log(this.redirectUrl)
          const url = `${TWITCH_OAUTH_URL}?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${this.redirectUrl}&response_type=code&scope=${TWITCH_SCOPES}&force_verify=true`;
          // console.log('Open this URL : ',url);
          var result = await AuthSession.startAsync({ authUrl: `${url}`, returnUrl: this.redirectUrl });
          // console.log(result);
          const CODE = result.params.code;
          const url_confirm = `${TWITCH_OAUTH_URL_SERVER}?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_SECRET_ID}&redirect_uri=${this.redirectUrl}&code=${CODE}&grant_type=authorization_code`;
          // console.log('Server confirm here : ',url_confirm);
          const response_serv = await fetch(url_confirm, {
              method: 'POST',
              headers: {
                  "accept": TWITCH_ACCEPT,
              }
          });
          var result_serv = await response_serv.json();
          resolve(result_serv);
        } catch (e) {
          reject(e)
        }
      });
    }

    getTwitchMetrics(accessToken) {
      return new Promise((resolve, reject) => {
        var to_send = {}
        fetch(`${TWITCH_HELIX_BASE_URL}/users`, {
          headers: {
            "Client-ID": TWITCH_CLIENT_ID,
            "Authorization": 'Bearer '+accessToken
          },
          method: "GET"
        })
        .then((response) => response.json())
        .then((responseJson) => {
          to_send.id = responseJson.data[0].id;
          to_send.username = responseJson.data[0].login;
          to_send.pp = responseJson.data[0].profile_image_url;
          to_send.data = responseJson.data[0];
          return fetch(`${TWITCH_HELIX_BASE_URL}/users/follows?to_id=${to_send.id}`, {
            headers: {
              "Client-ID": TWITCH_CLIENT_ID,
              "Authorization": 'Bearer '+accessToken
            },
            method: "GET"
          })
        })
        .then((response) => response.json())
        .then((responseJson) => {
          to_send.nb_followers = responseJson.total;
          to_send.social_network = "Twitch";
          resolve(to_send)
        })
        .catch((err) => reject(err));
      });
    }

    getAllTwitch(accessToken, userId) {
      return new Promise((resolve, reject) => {
        const client = TwitchClient.withCredentials(TWITCH_CLIENT_ID, accessToken);
        const clips = client.helix.clips.getClipsForBroadcasterPaginated(userId); // return https://d-fischer.github.io/twitch/reference/classes/HelixClip.html
        const videos = client.helix.videos.getVideosByUserPaginated(userId); // return https://d-fischer.github.io/twitch/reference/classes/HelixVideo.html
        Promise.all([
          clips.getAll(),
          videos.getAll()
        ]).then((resp) => {
          resolve(resp);
        }).catch((err) => {
          reject(err)
        })
      });
    }

    getStreamTwitch(accessToken, userId) {
      return new Promise((resolve, reject) => {
        const client = TwitchClient.withCredentials(TWITCH_CLIENT_ID, accessToken);
        const streams = client.helix.streams.getStreamMarkersForUserPaginated(userId).getAll()
          .then((res) => { resolve(res) })
          .catch((err) => reject(err))
      });
    }

    /* Instagram */

    getInstagramToken() {
      return new Promise(async (resolve, reject) => {
        try {
          // console.log(URL_REDIRECT)
          const url = `${INSTAGRAM_OAUTH_URL}?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${URL_REDIRECT}&response_type=code&scope=${INSTAGRAM_SCOPES}`;
          // console.log('Open this URL : ',url);
          var result = await AuthSession.startAsync({ authUrl: `${url}`, returnUrl: this.redirectUrl });
          // console.log(result);
          const CODE = result.params.code;
          const url_confirm = `${INSTAGRAM_OAUTH_URL_SERVER}`;
          // console.log('Server confirm here : ',url_confirm);
          var body = new FormData();
          body.append('client_secret', INSTAGRAM_SECRET);
          body.append('client_id', INSTAGRAM_CLIENT_ID);
          body.append('grant_type', "authorization_code");
          body.append('redirect_uri', `${URL_REDIRECT}`);
          body.append('code', CODE);
          const response_serv = await fetch(url_confirm, {
              method: 'POST',
              headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'multipart/form-data'
                },
              body: body
          });
          var result_serv = await response_serv.json();
          resolve(result_serv);
        } catch (e) {
          reject(e)
        }
      });
    }

    getInstagramMetrics(accessToken) {
      return new Promise((resolve, reject) => {
        var to_send = {}
        fetch(`${INSTAGRAM_BASE_URL}/me?fields=id,ig_id,account_type,media_count,username&access_token=${accessToken}`, {
          method: "GET"
        })
        .then((response) => response.json())
        .then((responseJson) => {
          to_send.id = responseJson.id;
          to_send.ig_id = responseJson.ig_id;
          to_send.media_count = responseJson.media_count;
          to_send.username = responseJson.username;
          to_send.account_type = responseJson.account_type;
          return fetch(`https://www.instagram.com/${to_send.username}/?__a=1`, {
            method: "GET"
          })
        })
        .then((response) => response.json())
        .then((responseJson) => {
          to_send.nb_followers = responseJson.graphql.user.edge_followed_by.count;
          to_send.pp = responseJson.graphql.user.profile_pic_url_hd;
          to_send.social_network = "Youtube";
          resolve(to_send)
        })
        .catch((err) => reject(err));
      });
    }

    getAllInstagramRec(accessToken, cursor, data, limit) {
      return new Promise((resolve, reject) => {
        var i = data.length;
        var url = `${INSTAGRAM_BASE_URL}/me/media?fields=id,thumbnail_url,media_type,media_url,permalink,username,timestamp&access_token=${accessToken}&limit=${limit}`;
        if(cursor != '') {
          url += `&next=${cursor}`;
        }
        fetch(url, {
          method: "GET"
        })
        .then((response) => response.json())
        .then((responseJson) => {
          var promises = [];
          cursor = responseJson.paging.next ? responseJson.paging.next : ''
          data = [...data, ...responseJson.data]
          responseJson.data.map((post) => {
              promises.push(fetch(`${INSTAGRAM_BASE_URL}/${post.id}/children?fields=id,thumbnail_url,media_type,media_url,permalink,username,timestamp&access_token=${accessToken}`, {
                method: "GET"
              }))
          });
          return Promise.all(promises)
        })
        .then((response) => {
          return Promise.all(
            response.map(async resp => {
              return resp.json();
            })
          );
        })
        .then((allResponse) => {
          allResponse.map((p) => {
              data[i].child = p;
              i++;
          });
          if (cursor != '') {
            resolve(this.getAllInstagramRec(accessToken, cursor, data, limit));
          } else {
            resolve(data);
          }
        })
        .catch((err) => reject(err))
      })
    }

    getAllInstagram (accessToken) {
      return new Promise((resolve, reject) => {
        var data = [];
        var cursor = '';
        this.getAllInstagramRec(accessToken, cursor, data, INSTAGRAM_MAX_RESULT)
          .then((res) => resolve(res))
          .catch((err) => reject(err))
      })
    }


    /* Youtube */

    getYoutubeToken() {
      return new Promise(async (resolve, reject) => {
        try {
          const res = await Google.logInAsync({
            iosClientId: GOOGLE_IOS_CLIENT_ID,
            androidClientId: GOOGLE_ANDROID_CLIENT_ID,
            scopes: [YOUTUBE_SCOPES]
          });
          if (res.type === 'success') {
            resolve(res)
          } else {
            reject(res)
          }
        } catch (e) {
          reject(e)
        }
      });
    }

    getYoutubeMetrics(accessToken) {
      return new Promise((resolve, reject) => {
        fetch(`${YOUTUBE_BASE_URL}/channels/?mine=true&part=${YOUTUBE_PART_CHANNELS}`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        })
        .then((response) => response.json())
        .then((responseJson) => {
          if(responseJson.items && responseJson.items.length > 0) {
            resolve({
              username: responseJson.items[0].snippet.title,
              pp: responseJson.items[0].snippet.thumbnails.default.url,
              nb_followers: parseInt(responseJson.items[0].statistics.subscriberCount),
              social_network: "Youtube",
              upload_url: responseJson.items[0].contentDetails.relatedPlaylists.uploads,
              data: responseJson
            })
          } else {
            reject(responseJson)
          }
        })
        .catch((err) => reject(err));
      });
    }

    async myVideoslList(token, id_playlist, maxResults) {
        var response = await fetch(`${YOUTUBE_BASE_URL}/playlistItems/?playlistId=${id_playlist}&maxResults=${maxResults}&part=${YOUTUBE_PART_PLAYLIST}&key=${YOUTUBE_KEY}`, {
            method: 'GET'
        });

        var i = 0;

        var all_result = {
          data: []
        };

        var result = await response.json();

        all_result.data[i] = result;

        // Fetch all of the videos
        var resultsPerPage = result.pageInfo.resultsPerPage;
        var totalResults = result.pageInfo.totalResults;
        var tokenPage = result.nextPageToken;
        var modulo = totalResults % resultsPerPage;
        var num_iteration = parseInt(totalResults / resultsPerPage);
        if (modulo != 0 ) {
            num_iteration++;
        }
        // console.log('Resultats par page :', resultsPerPage);
        // console.log('Nombre total de résultats:', totalResults);
        // console.log('Nombre d\'intération :', num_iteration);

        if(num_iteration == 1) {
          return all_result;
        }

        while (num_iteration > 0) {
            response = await fetch(`${YOUTUBE_BASE_URL}/playlistItems/?playlistId=${id_playlist}&pageToken=${tokenPage}&maxResults=${maxResults}&part=${YOUTUBE_PART_PLAYLIST}&key=${YOUTUBE_KEY}`, {
                method: 'GET'
            });
            result = await response.json();
            all_result.data[i] = result;
            tokenPage = result.nextPageToken;
            if(!tokenPage) {
                // console.log('Plus de next token...');
                break;
            }
            num_iteration--;
            i++;
        }

        return all_result;
    }


    getAllYoutube (accessToken, idPlaylist) {
      return new Promise(async (resolve, reject) => {
        const res = await this.myVideoslList(accessToken, idPlaylist, YOUTUBE_MAX_RESULT);
        resolve(res);
      })
    }


}
