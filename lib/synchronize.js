import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';

import {
  TWITCH_CLIENT_ID,
  TWITCH_SECRET_ID,
  INSTAGRAM_CLIENT_ID,
  INSTAGRAM_SECRET,
  YOUTUBE_KEY,
  EXPO_SCHEME
} from 'react-native-dotenv'

const TWITCH_KRAKEN_BASE_URL="https://api.twitch.tv/kraken";
const TWITCH_HELIX_BASE_URL="https://api.twitch.tv/helix";
const TWITCH_OAUTH_URL="https://id.twitch.tv/oauth2/authorize";
const TWITCH_OAUTH_URL_SERVER="https://id.twitch.tv/oauth2/token";
const TWITCH_SCOPES = "collections_edit%20user_follows_edit%20user_subscriptions%20user_read%20user_subscriptions";
const TWITCH_ACCEPT = "application/vnd.twitchtv.v5+json";

const INSTAGRAM_BASE_URL="https://api.instagram.com/v1";
const INSTAGRAM_OAUTH_URL="https://api.instagram.com/oauth/authorize";
const INSTAGRAM_OAUTH_URL_SERVER="https://api.instagram.com/oauth/access_token";
const INSTAGRAM_SCOPES="basic";

const YOUTUBE_BASE_URL="https://www.googleapis.com/youtube/v3";
const YOUTUBE_PART_CHANNELS = "snippet%2CcontentDetails%2Cstatistics";
const YOUTUBE_PART_PLAYLIST = "snippet%2CcontentDetails";
const YOUTUBE_MAX_RESULT = "50";

export class Synchronize {

    static myInstance = null;

    /**
    * @returns {Synchronize}
    */
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

    getTwitchToken() {
      return new Promise(async (resolve, reject) => {
        try {
          // console.log(this.redirectUrl)
          const url = `${TWITCH_OAUTH_URL}?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${this.redirectUrl}&response_type=code&scope=${TWITCH_SCOPES}&force_verify=true`;
          // console.log('Open this URL : ',url);
          var result = await AuthSession.startAsync({ authUrl: `${url}` });
          console.log(result);
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

    async tokenValid(token) {
      const response = await fetch(`${TWITCH_KRAKEN_BASE_URL}?oauth_token=${token}`, {
          method: 'GET',
          headers: {
              "client-id": TWITCH_CLIENT_ID,
              "accept": TWITCH_ACCEPT
          }
      });

      let result = await response.json();

      return result;
    }

    async currentUserInfoTwitch(token) {
        const response = await fetch(`${TWITCH_KRAKEN_BASE_URL}/user`, {
            method: 'GET',
            headers: {
                "accept": TWITCH_ACCEPT,
                "authorization": `OAuth ${token}`,
                "client-id": TWITCH_CLIENT_ID,
            }
        });

        let result = await response.json();

        return result;
    }


    async getProfilePictureFollowerTwitch (token, callback) {

      const user = await this.currentUserInfoTwitch(token);

      const follow_req = await fetch(`${TWITCH_HELIX_BASE_URL}/users/follows?to_id=${user._id}`, {
          method: 'GET',
          headers: {
              "Client-ID": TWITCH_CLIENT_ID
          }
      });
      let follow_res = await follow_req.json();

      var final_rep = {username: user.name, pp: user.logo, nb_followers: follow_res.total, social_network: "Synchronize"};

      callback(final_rep);
    }


    async getLastPostTwitch (token, callback) {

      const user = await this.currentUserInfoTwitch(token);

      //console.log(user);

      if(user.status == 401) {
        console.log('ERROR TOKEN');
        callback(user);
      } else {
        console.log('USER ID : ', user._id);
        let all_result = {
          data: []
        };
        const response1 = await fetch(`${TWITCH_HELIX_BASE_URL}/videos?user_id=${user._id}`, {
            method: 'GET',
            headers: {
                "Client-ID": TWITCH_CLIENT_ID
            }
        });
        let result1 = await response1.json();
        //console.log(result1);

        const response2 = await fetch(`${TWITCH_HELIX_BASE_URL}/streams?user_id=${user._id}`, {
            method: 'GET',
            headers: {
                "Client-ID": TWITCH_CLIENT_ID
            }
        });
        let result2 = await response2.json();
        //console.log(result2);

        /*const response3 = await fetch(`${TWITCH_HELIX_BASE_URL}/clips?broadcaster_id=${user._id}`, {
            method: 'GET',
            headers: {
                "Client-ID": TWITCH_CLIENT_ID
            }
        });
        let result3 = await response3.json();*/
        //console.log(result3);

        all_result.data[0] = result1;
        all_result.data[1] = result2;

        callback(all_result);
      }

    }




    async getUserAccessTokenInsta(callback) {
        /* STEP 1 */
        const url = `${INSTAGRAM_OAUTH_URL}?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${`${AuthSession.getRedirectUrl()}/redirect`}&response_type=code&scope=${INSTAGRAM_SCOPES}`;
        console.log('Open this URL : ',url);
        var result = await AuthSession.startAsync({ authUrl: `${url}` });
        console.log(result);
        const CODE = result.params.code;
        /* STEP 2 */
        const url_confirm = `${INSTAGRAM_OAUTH_URL_SERVER}`;
        console.log('Server confirm here : ',url_confirm);
        var body = new FormData();
        body.append('client_secret', INSTAGRAM_SECRET);
        body.append('client_id', INSTAGRAM_CLIENT_ID);
        body.append('grant_type', "authorization_code");
        body.append('redirect_uri', `${AuthSession.getRedirectUrl()}/redirect`);
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
        callback(result_serv);
    }

    async getProfilePictureFollowerInsta (token, callback) {
      const response = await fetch(`${INSTAGRAM_BASE_URL}/users/self?access_token=${token}`, {
          method: 'GET'
      });

      let result = await response.json();

      var final_rep = {username: result.data.username, pp: result.data.profile_picture, nb_followers: result.data.counts.followed_by, social_network: "Instagram"};

      callback(final_rep);
    }

    async getLastPostInsta (token, callback) {
        const response = await fetch(`${INSTAGRAM_BASE_URL}/users/self/media/recent?access_token=${token}&count=40 `, {
            method: 'GET'
        });

        var result = await response.json();

        callback(result);
    }



    async getUserAccessTokenYoutube(callback) {
        console.log('Login with Youtube');
        try {
            await GoogleSignIn.initAsync({
              clientId: '<YOUR_IOS_CLIENT_ID>',
              scopes: ["https://www.googleapis.com/auth/youtube"]
            });
            await GoogleSignIn.askForPlayServicesAsync();
            const { type, user } = await GoogleSignIn.signInAsync();
            if (result.type === "success") {
                console.log('Youtube login - SUCCESS');
                console.log(result);
                this.access_token = result.accessToken;
                result.access_token = result.accessToken;
                callback(result);
            } else {
                console.log("Youtube login - ERROR");
                console.log(result);
            }
        } catch (e) {
            console.log("Error: ", e)
        }
    }

    async myVideoslList(token, id_playlist) {
        //console.log("YOUTUBE KEY : ", YOUTUBE_KEY);
        var response = await fetch(`${YOUTUBE_BASE_URL}/playlistItems/?playlistId=${id_playlist}&maxResults=${YOUTUBE_MAX_RESULT}&part=${YOUTUBE_PART_PLAYLIST}&key=${YOUTUBE_KEY}`, {
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
        console.log('Resultats par page :', resultsPerPage);
        console.log('Nombre total de résultats:', totalResults);
        console.log('Nombre d\'intération :', num_iteration);

        if(num_iteration == 1) {
          return all_result;
        }

        while (num_iteration > 0) {
            response = await fetch(`${YOUTUBE_BASE_URL}/playlistItems/?playlistId=${id_playlist}&pageToken=${tokenPage}&maxResults=${YOUTUBE_MAX_RESULT}&part=${YOUTUBE_PART_PLAYLIST}&key=${YOUTUBE_KEY}`, {
                method: 'GET'
            });
            result = await response.json();
            all_result.data[i] = result;
            tokenPage = result.nextPageToken;
            if(!tokenPage) {
                console.log('Plus de next token...');
                break;
            }
            num_iteration--;
            i++;
        }

        return all_result;
    }

    async myInformations(token) {
        const response = await fetch(`${YOUTUBE_BASE_URL}/channels/?mine=true&part=${YOUTUBE_PART_CHANNELS}`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        let result = await response.json();

        return result;
    }

    async getProfilePictureFollowerYoutube (token, callback) {

      const user = await this.myInformations(token);

      var final_rep = {username: user.items[0].snippet.title, pp: user.items[0].snippet.thumbnails.default.url, nb_followers: parseInt(user.items[0].statistics.subscriberCount), social_network: "Youtube"};

      callback(final_rep);
    }


    async getLastPostYoutube (token, callback) {
        const result1 = await this.myInformations(token);
        if (result1.error){
          callback(result1);
        } else {
          const result2 = await this.myVideoslList(token, result1.items[0].contentDetails.relatedPlaylists.uploads);
          callback(result2);
        }

    }


}
