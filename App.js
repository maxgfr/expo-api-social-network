import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text
} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import { Synchronize } from './lib/synchronize';

export default function App() {

  _onTwitch = () => {
    var access_token = '';
    Synchronize.getInstance().getTwitchToken()
      .then((res) => {
        console.log(res)
        access_token = res.access_token;
        return Synchronize.getInstance().getTwitchMetrics(access_token)
      })
      .then((res) => {
        console.log(res)
        return Synchronize.getInstance().getAllTwitch(access_token, res.id)
      })
      .then((res) => {
        console.log(res)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  _onYoutube = () => {

  }

  _onInstagram = () => {
    var access_token = '';
    Synchronize.getInstance().getInstagramToken()
      .then((res) => {
        console.log(res)
        access_token = res.access_token;
        return Synchronize.getInstance().getInstagramMetrics(access_token)
      })
      .then((res) => {
        console.log(res)
        return Synchronize.getInstance().getAllInstagram(access_token)
      })
      .then((res) => {
        console.log(res)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <TouchableOpacity onPress={_onTwitch} style={[styles.button, { backgroundColor: "#6441a5" }]}>
        <Text style={styles.text}>Twitch</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={_onYoutube} style={[styles.button, { backgroundColor: "#FF0000" }]}>
        <Text style={styles.text}>Youtube</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={_onInstagram}>
        <LinearGradient
          colors={['#405DE6', '#5851DB', '#833AB4', '#C13584', '#E1306C', '#FD1D1D', '#F56040', '#F77737', '#FCAF45', '#FFDC80']}
          start={[0.9, 0.1]}
          end={[0.1, 0.9]}
          style={[styles.button, { backgroundColor: "#FD1D1D" }]}>
            <Text style={styles.text}>Instagram</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  text: {
    fontWeight: '600',
    fontSize: 14,
    color: '#ffffff'
  },
  button: {
    width: 100,
    height: 30,
    backgroundColor: "#4285F4",
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    marginBottom: 20,
    flexDirection: 'row'
  },
});
