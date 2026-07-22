import React, { useState } from 'react';
import {
    View,
    Image,
    Text,
    TextInput,
    type LayoutChangeEvent,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView,
    Keyboard,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import KeyboardDoneAccessory from '@/src/components/KeyboardDoneAccessory';
import styles from '@/css/auth/auth';
import { Flex } from '@ant-design/react-native';

const DESIGN_RATIO = 335 / 90;
const nameInputAccessoryViewID = 'authNameDoneToolbar';
const idNumberInputAccessoryViewID = 'authIdNumberDoneToolbar';

export default function AuthPage() {
    const [imgWidth, setImgWidth] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [idNumber, setIdNumber] = useState('');

    const onBoxLayout = (e: LayoutChangeEvent) => {
        const nextWidth = Math.floor(e.nativeEvent.layout.width);
        if (nextWidth > 0 && nextWidth !== imgWidth) {
            setImgWidth(nextWidth - 16);
        }
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            // TODO: 提交审核
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageLayout
            style={styles.container}
            edges={[]}
            keyboardAccessory={
                <>
                    <KeyboardDoneAccessory nativeID={nameInputAccessoryViewID} />
                    <KeyboardDoneAccessory nativeID={idNumberInputAccessoryViewID} />
                </>
            }>
            <View style={styles.page}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        bounces={false}>
                        <View style={styles.content}>
                            <View style={styles.topImgBox} onLayout={onBoxLayout}>
                                {imgWidth > 0 ? (
                                    <Image
                                        style={{
                                            width: imgWidth,
                                            height: imgWidth / DESIGN_RATIO,
                                        }}
                                        source={require('@/assets/images/auth/smrz.png')}
                                        resizeMode="contain"
                                    />
                                ) : null}
                            </View>
                            <View style={styles.authContent}>
                                <Text style={styles.authContentTitle}>身份证照片</Text>
                                <Text style={styles.authContentSubtitle}>
                                    上传证件照片进行身份验证，全程保证隐私安全
                                </Text>
                                <Flex style={styles.authContentImgBox} justify="between">
                                    <TouchableOpacity style={styles.authContentImgItem}>
                                        <Image
                                            style={styles.authContentImgItemImg}
                                            source={require('@/assets/images/auth/sfz_z.png')}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.authContentImgItem}>
                                        <Image
                                            style={styles.authContentImgItemImg}
                                            source={require('@/assets/images/auth/sfz_f.png')}
                                        />
                                    </TouchableOpacity>
                                </Flex>
                            </View>
                            <View style={styles.authContent}>
                                <Text style={styles.authContentTitle}>认证信息</Text>
                                <View style={styles.formFields}>
                                    <Flex justify="between" align="center" style={styles.formRow}>
                                        <Text style={styles.formLabel}>姓名</Text>
                                        <TextInput
                                            style={styles.formInput}
                                            value={name}
                                            onChangeText={setName}
                                            placeholder="请输入姓名"
                                            placeholderTextColor="#999999"
                                            returnKeyType="done"
                                            inputAccessoryViewID={nameInputAccessoryViewID}
                                        />
                                    </Flex>
                                    <View style={styles.formDivider} />
                                    <Flex justify="between" align="center" style={styles.formRow}>
                                        <Text style={styles.formLabel}>身份证号</Text>
                                        <TextInput
                                            style={styles.formInput}
                                            value={idNumber}
                                            onChangeText={setIdNumber}
                                            placeholder="请输入18位身份证号"
                                            placeholderTextColor="#999999"
                                            maxLength={18}
                                            autoCapitalize="characters"
                                            returnKeyType="done"
                                            inputAccessoryViewID={idNumberInputAccessoryViewID}
                                        />
                                    </Flex>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>

                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
                        disabled={submitting}
                        onPress={handleSubmit}>
                        <Flex style={{ flex: 1 }}>
                            <Image
                                style={styles.primaryBtnIcon}
                                source={require('@/assets/images/auth/icon_upload.png')}
                            />
                            <Text style={styles.primaryBtnText}>
                                {submitting ? '提交中...' : '提交审核'}
                            </Text>
                        </Flex>
                    </TouchableOpacity>
                </View>
            </View>
        </PageLayout>
    );
}
