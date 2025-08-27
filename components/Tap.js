import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import hanzi from 'hanzi';
import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Tap = (props) => {
    const [textHanyuDetail, setTextHanyuDetail] = React.useState(null)
    const [textStyleIndex, setTextStyleIndex] = React.useState(null)
    const [textStyleIndex1, setTextStyleIndex1] = React.useState(null)
    const [level, setLevel] = React.useState();
    const [sound, setSound] = React.useState();

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

    async function playSound() {

        // Always stop and unload previous sound before playing a new one
        if (sound) {
            try {
                await sound.stopAsync();
                await sound.unloadAsync();
            } catch (e) {
                // ignore errors if sound already stopped/unloaded
            }
        }

        if (setSoundUrl(props.soundUrl)[1] == '') {
            const { sound: newSound } = await Audio.Sound.createAsync({
                uri: "https://cdn.yoyochinese.com/audio/pychart/"
                    + props.soundUrl + ".mp3"
            });
            setSound(newSound);
            await newSound.playAsync();
        } else {
            const { sound: firstSound } = await Audio.Sound.createAsync({
                uri: "https://cdn.yoyochinese.com/audio/pychart/"
                    + setSoundUrl(props.soundUrl)[0] + ".mp3"
            });
            setSound(firstSound);
            await firstSound.playAsync();

            setTimeout(async () => {
                // Stop and unload previous sound before playing the next
                try {
                    await firstSound.stopAsync();
                    await firstSound.unloadAsync();
                } catch (e) {}
                const { sound: secondSound } = await Audio.Sound.createAsync({
                    uri: "https://cdn.yoyochinese.com/audio/pychart/"
                        + setSoundUrl(props.soundUrl)[1] + ".mp3"
                });
                setSound(secondSound);
                await secondSound.playAsync();
            }, 600);
        }
    }

    async function playPinyinSound(pinyin) {
        const hasUppercase = /[A-Z]/.test(pinyin);
        if (!hasUppercase) {
            const { sound } = await Audio.Sound.createAsync({
                uri: "https://cdn.yoyochinese.com/audio/pychart/"
                    + pinyin + ".mp3"
            });
            // console.log("https://cdn.yoyochinese.com/audio/pychart/"
            //     + pinyin + ".mp3");
            setSound(sound)
            //   console.log('Playing Sound');
            if ("https://cdn.yoyochinese.com/audio/pychart/"
                + pinyin + ".mp3") {
                await sound.playAsync();
            }
        }
    }

    React.useEffect(() => {
        // console.log(setSoundUrl(props.soundUrl));

        return sound
            ? () => {
                // console.log('Unloading Sound');
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    React.useEffect(() => {
        // Only call hanzi.start() on native devices (not web)
        if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
            hanzi.start();
        }
    }, [textStyleIndex])

    React.useEffect(() => {
        if (props.index < 150) {
            setLevel("A1")
        }
        else if (props.index < 300) {
            setLevel("A2")
        }
        else if (props.index < 600) {
            setLevel("B1")
        }
        else if (props.index < 1200) {
            setLevel("B2")
        }
    }, [props.index])

    return (
        <View style={styles.container}>
            <View style={styles.tap}>
                <Text style={styles.tapLevel}>{level}</Text>
                <View style={styles.tapSimlified}>
                    {
                        props.tradional != props.simplified ?
                            <Text style={styles.tapSimlifiedText}>simplified: &nbsp; </Text>
                            : null
                    }
                    <Text style={styles.tapHanyu}>
                        {Array.from({ length: props.simplified.length }, (_, i) => (
                            <View key={i} style={styles.tapRow}>
                                <Pressable onPress={() => {
                                    setTextStyleIndex(i)
                                    setTextHanyuDetail(props.simplified[i])
                                }}
                                >
                                    <Text style={[
                                        styles.tapHanyu,
                                        (textStyleIndex === i) ?
                                            styles.tapHanyuHover : null
                                    ]}>
                                        {props.simplified[i]}
                                    </Text></Pressable>
                            </View>
                        ))}
                        <sup style={props.count >= 3 ? { color: 'red' } : {}}>
                            {props.count >= 3 ? 
                        'Pro' : props.count }
                        </sup>
                    </Text>
                </View>
                <View>
                    {
                        props.tradional != props.simplified ?
                            <View style={styles.tapSimlified}>
                                <Text style={styles.tapSimlifiedText}>
                                    traditional:&nbsp;
                                </Text>
                                <Text style={styles.tapHanyu}>
                                    {props.tradional && Array.from({ length: props.tradional.length }, (_, j) => (
                                        <Text key={j} style={[
                                            styles.tapHanyu,
                                            textStyleIndex1 == j ? styles.tapHanyuHover : null
                                        ]} onMouseEnter={() => {
                                            setTextStyleIndex1(j)
                                        }}
                                            onMouseLeave={() => {
                                                setTextStyleIndex1(null)
                                            }}
                                        >
                                            {props.tradional[j]}
                                        </Text>
                                    ))}
                                </Text>
                            </View>
                            : null
                    }
                </View>
                <TouchableOpacity style={styles.tapPinyin}
                    onPress={() => playSound()}
                >
                    <Text style={styles.tapPinyinText} >
                        {props.pinyin} &nbsp;
                        <Ionicons name="volume-high" size={23} color="black" />
                    </Text>
                </TouchableOpacity>
                <Text style={styles.tapMeaning}>{props.meaning}</Text>

            </View>
            {
                (textStyleIndex != null)
                    ? <View style={styles.tapHanyuDetailView}>
                        <TouchableOpacity style={styles.closeButton}
                            onPress={() => { setTextStyleIndex(null) }}>
                            <FontAwesome name="times" size={23} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => { setTextStyleIndex(null) }}>
                            <Text style={styles.tapHanyuDetailText}>
                                {textHanyuDetail}
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.tapPinyinText} >
                            {
                                hanzi.getPinyin(textHanyuDetail)[0] == hanzi.getPinyin(textHanyuDetail)[1]
                                    ?
                                    <Pressable onPress={() => {
                                        playPinyinSound(hanzi.getPinyin(textHanyuDetail)[0])
                                    }}
                                        style={[styles.tapRow, { justifyContent: 'center' }]}>
                                        <Text>{hanzi.getPinyin(textHanyuDetail)[0]}</Text>
                                        <Ionicons name="volume-high" size={23} color="black" />
                                    </Pressable>
                                    :
                                    <View>
                                        {
                                            hanzi.getPinyin(textHanyuDetail)[0].charAt(0)
                                                != hanzi.getPinyin(textHanyuDetail)[0].charAt(0).toUpperCase()
                                                ?
                                                <Pressable onPress={() => {
                                                    playPinyinSound(hanzi.getPinyin(textHanyuDetail)[0])
                                                }}
                                                    style={[styles.tapRow, { justifyContent: 'center' }]}><Text>{hanzi.getPinyin(textHanyuDetail)[0]}</Text>
                                                    <Ionicons name="volume-high" size={23} color="black" />
                                                </Pressable> : null
                                        }
                                        <Pressable onPress={() => {
                                            playPinyinSound(hanzi.getPinyin(textHanyuDetail)[1])
                                        }}
                                            style={[styles.tapRow, { justifyContent: 'center' }]}><Text>
                                                {hanzi.getPinyin(textHanyuDetail)[1]}
                                            </Text>
                                            <Ionicons name="volume-high" size={23} color="black" />
                                        </Pressable>
                                    </View>
                            }
                        </View>
                        <View style={styles.triangle} />
                        <Text style={styles.tapPinyinText}>
                            {textHanyuDetail && hanzi.definitionLookup(textHanyuDetail).map((w, i) => {
                                return (i == 0 ? <Text key={i}>
                                    {w.definition.split('/').slice(0, 3).join('/')}
                                </Text> : null)
                            })}
                        </Text>
                    </View> : null
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tap: {
        backgroundColor: '#fafafa',
        margin: 9,
        paddingHorizontal: 50,
        paddingTop: 10,
        paddingBottom: 30,
        textAlign: 'center',
        borderRadius: 6,
    },
    tapRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tapLevel: {
        fontWeight: 600,
    },
    count: {
        color: 'red'
    },
    tapHanyu: {
        fontSize: 26,
        cursor: 'default',
        marginLeft: 3,
    },
    tapHanyuHover: {
        fontSize: 26,
        cursor: 'default',
        marginLeft: 3,
        backgroundColor: 'blue',
        color: 'white',
    },
    tapSimlified: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tapSimlifiedText: {
        fontSize: 12,
    },
    tapPinyin: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tapPinyinText: {
        textAlign: 'center',
        color: '#000'
    },
    tapHanyuDetailView: {
        marginLeft: 10,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        zIndex: -1,
    },
    tapHanyuDetailText: {
        textAlign: 'center',
        fontSize: 23
    },
    closeButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1,
        backgroundColor: 'transperant',
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderTopWidth: 20,
        borderRightWidth: 20,
        borderTopColor: 'transparent',
        borderRightColor: '#fff',
        position: 'absolute',
        top: 10,
        left: -19,
    },
});

export default Tap