import React from 'react';
import { View, Text, Image, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/auth/login';
import PageLayout from '@/src/components/PageLayout';

export default function IndexPage() {
    const navigation: any = useNavigation();

    return (
        <PageLayout style={styles.container} withStackHeader={false}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    bounces={false}
                    showsVerticalScrollIndicator={false}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.body}>
                            <View style={styles.content}>
                                <Image style={styles.logo} source={require('@/assets/images/login/logo.png')} />
                                <Text style={styles.pageTitle}>莱益晟</Text>
                                <Text style={styles.pageSubTitle}>您的<Text style={styles.pageSubTitleBold}>AI健康伴侣</Text></Text>

                                <View style={{ marginTop: 180 }}>
                                    <TouchableOpacity
                                        style={styles.indexLoginBtn}
                                        onPress={() => navigation.navigate('Login')}>
                                        <Flex justify="center" style={{ flex: 1 }}>
                                            <Text style={styles.indexLoginBtnText}>登录</Text>
                                        </Flex>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.indexRegisterBtn}
                                        onPress={() => navigation.navigate('Register')}>
                                        <Flex justify="center" style={{ flex: 1 }}>
                                            <Text style={styles.indexRegisterBtnText}>注册</Text>
                                        </Flex>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </PageLayout>
    );
}
