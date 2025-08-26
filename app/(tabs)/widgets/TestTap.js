import { View, Text, TextInput, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useBearsStore } from '../store.js';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Pressable } from 'react-native';

export default function TestTap(props) {
    const updateScore = useBearsStore(state => state.updateScore);
    const updateQAnswered = useBearsStore(state => state.updateQAnswered);
    const updateQCorrect = useBearsStore(state => state.updateQCorrect);
    const isFinish = useBearsStore(state => state.isFinish);
    const [text, setText] = useState();
    const [answerN, setAnswerN] = useState(0);
    const [placeholder, setPlaceholder] = useState('Enter text here')
    const [sound, setSound] = useState();

    async function playSound(m_type) {
        // console.log('Loading Sound');

        if (m_type === true) {
            const { sound } = await Audio.Sound.createAsync(
                require('../../../assets/audio/correct.mp3')
            );
            setSound(sound);
            await sound.playAsync()
        }
        else if (m_type === false) {
            const { sound } = await Audio.Sound.createAsync(
                require('../../../assets/audio/incorrect.wav')
            );
            setSound(sound);
            await sound.playAsync()
        }
    }

    useEffect(() => {
        // console.log(text);
        // console.log(props.correctAnswer);
        if (text == props.correctAnswer) {
            updateQCorrect();
            //  console.log('correctAnswer');
            updateScore();
            playSound(true);
        }
    }, [text])

    function setSoundUrl(url) {
        const soundUrlArr = [];
        const match = url.match(/^([a-zA-Z]+)(\d.*)/);

        if (match) {
            const firstPart = match[1] + match[2].match(/^\d+/)[0];
            const secondPart = match[2].replace(/^\d+/, '');
            soundUrlArr.push(firstPart);
            soundUrlArr.push(secondPart);

            //   console.log(firstPart, secondPart);
        } else {
            console.log('Invalid string');
        }
        return soundUrlArr;
    }

    const playPinyinSound = async () => {
        if (setSoundUrl(props.sound)[1] == '') {
            const { sound } = await Audio.Sound.createAsync({
                uri: "https://cdn.yoyochinese.com/audio/pychart/"
                    + props.sound + ".mp3"
            });
            // console.log("https://cdn.yoyochinese.com/audio/pychart/"
            // + props.soundUrl + ".mp3");
            setSound(sound);
            //   console.log('Playing Sound');
            await sound.playAsync();
        }
        else {
            const { sound } = await Audio.Sound.createAsync({
                uri: "https://cdn.yoyochinese.com/audio/pychart/"
                    + setSoundUrl(props.sound)[0] + ".mp3"
            });

            setSound(sound);

            await sound.playAsync().then(
                setTimeout(async function () {
                    const { sound } = await Audio.Sound.createAsync({
                        uri: "https://cdn.yoyochinese.com/audio/pychart/"
                            + setSoundUrl(props.sound)[1] + ".mp3"
                    });

                    setSound(sound);
                    await sound.playAsync()

                }, 600)
            )
        }
    }

    function Assistant() {
        // console.log('Assistant');
        setPlaceholder(props.pinyin)
    }

    function handleBlur() {
        if (text !== undefined || text !== '') {
           // console.log(text, props.index);
            if (answerN == 1) {
                updateQAnswered()
            }
        }
    }

    return (
        <View style={styles.testView}>
            <View style={styles.testContent}>
                <Text style={styles.text}>Q{props.index}. {props.testTitle} in Chinese(simplified) is: </Text>
                <View>
                    <TextInput required style={styles.input} placeholder={placeholder}
                        onFocus={() => { playPinyinSound(); setAnswerN(answerN + 1) }}
                        onBlur={() => { handleBlur() }}
                        onChangeText={(text) => { setText(text) }} />
                    {
                        isFinish ?
                            text == props.correctAnswer
                                ? <Text>Correct</Text>
                                :(
                                <View>
                                <Text>Wrong, right answer is: 
                                  <Text style={{ marginLeft: 7, fontSize: 21}}>
                                    {props.correctAnswer}
                                  </Text>
                                  <Text>[{props.pinyin}]</Text>
                                </Text>
                                </View>)
                            : null
                    }
                    <Pressable onPress={() => Assistant()}>
                        <MaterialCommunityIcons name="assistant"
                            size={24} color="black" />
                    </Pressable>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    testView: {
        display: 'flex',
        justifyContent: 'center',
        margin: 10,
        backgroundColor: 'red',
        borderRadius: 10,
    },
    testContent: {
        marginLeft: 10,
        padding: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        backgroundColor: '#fff',

    },
    text: {
        fontSize: 21,
        marginBottom: 10,
    },
    input: {
        fontSize: 20,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        padding: 7,
    }
});