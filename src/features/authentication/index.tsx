import React, { useCallback, useMemo, useRef, useState } from 'react';
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
    Platform,
    findNodeHandle,
    type FocusEvent,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import KeyboardDoneAccessory from '@/src/components/KeyboardDoneAccessory';
import RegionCascader from '@/src/components/RegionCascader';
import styles from '@/css/auth/auth';
import { Flex, Toast } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { submitIdentityAudit } from '@/api/identityAudit';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import { regionSelectionFromParts } from '@/src/utils/regionData';
import {
    buildPersonalAuditPayload,
    formatRegionLabel,
    pickIdCardImageFromLibrary,
    uploadIdCardImage,
    validatePersonalAuthForm,
    type PersonalAuthForm,
} from './utils/identityAuditHelpers';

const DESIGN_RATIO = 335 / 90;
const nameInputAccessoryViewID = 'authNameDoneToolbar';
const idNumberInputAccessoryViewID = 'authIdNumberDoneToolbar';
const detailInputAccessoryViewID = 'authDetailDoneToolbar';

const EMPTY_FORM: PersonalAuthForm = {
    name: '',
    idCard: '',
    residentialProvince: '',
    residentialCity: '',
    residentialDistrict: '',
    residentialStreet: '',
    residentialDetail: '',
};

export default function AuthPage() {
    const navigation = useNavigation();
    const scrollRef = useRef<ScrollView>(null);
    const phonenumber = useSelector((s: RootState) => s.user.systemUser?.phonenumber);
    const [imgWidth, setImgWidth] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingSide, setUploadingSide] = useState<'front' | 'back' | null>(null);
    const [form, setForm] = useState<PersonalAuthForm>(EMPTY_FORM);
    const [frontPreviewUri, setFrontPreviewUri] = useState('');
    const [backPreviewUri, setBackPreviewUri] = useState('');

    const regionLabel = useMemo(() => formatRegionLabel(form), [form]);
    const regionValue = useMemo(
        () =>
            regionSelectionFromParts(
                form.residentialProvince,
                form.residentialCity,
                form.residentialDistrict,
                form.residentialStreet,
            ),
        [form.residentialProvince, form.residentialCity, form.residentialDistrict, form.residentialStreet],
    );

    const scrollFocusedInputIntoView = useCallback((e: FocusEvent) => {
        const targetHandle = findNodeHandle(e.target as unknown as number | React.Component);
        if (targetHandle == null) return;

        setTimeout(() => {
            const scrollView = scrollRef.current as ScrollView & {
                getScrollResponder?: () => {
                    scrollResponderScrollNativeHandleToKeyboard?: (
                        nodeHandle: number,
                        additionalOffset: number,
                        preventNegativeScrollOffset?: boolean,
                    ) => void;
                };
            } | null;
            const responder = scrollView?.getScrollResponder?.();
            if (responder?.scrollResponderScrollNativeHandleToKeyboard) {
                responder.scrollResponderScrollNativeHandleToKeyboard(targetHandle, 100, true);
                return;
            }
            scrollRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 80 : 120);
    }, []);

    const onBoxLayout = (e: LayoutChangeEvent) => {
        const nextWidth = Math.floor(e.nativeEvent.layout.width);
        if (nextWidth > 0 && nextWidth !== imgWidth) {
            setImgWidth(nextWidth - 16);
        }
    };

    const patchForm = <K extends keyof PersonalAuthForm>(key: K, value: PersonalAuthForm[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handlePickIdCard = async (side: 'front' | 'back') => {
        if (uploadingSide || submitting) return;
        const file = await pickIdCardImageFromLibrary(side);
        if (!file) return;

        if (side === 'front') {
            setFrontPreviewUri(file.uri);
        } else {
            setBackPreviewUri(file.uri);
        }

        setUploadingSide(side);
        const loadingKey = Toast.loading('上传中', 0);
        try {
            const uploaded = await uploadIdCardImage(file);
            if (!uploaded) {
                Toast.show('上传失败，请稍后重试');
                if (side === 'front') {
                    setFrontPreviewUri('');
                    patchForm('idCardFrontOssId', undefined);
                } else {
                    setBackPreviewUri('');
                    patchForm('idCardBackOssId', undefined);
                }
                return;
            }
            if (side === 'front') {
                setFrontPreviewUri(uploaded.url);
                patchForm('idCardFrontOssId', uploaded.ossId);
            } else {
                setBackPreviewUri(uploaded.url);
                patchForm('idCardBackOssId', uploaded.ossId);
            }
        } catch {
            Toast.show('上传失败，请稍后重试');
            if (side === 'front') {
                setFrontPreviewUri('');
                patchForm('idCardFrontOssId', undefined);
            } else {
                setBackPreviewUri('');
                patchForm('idCardBackOssId', undefined);
            }
        } finally {
            Toast.remove(loadingKey);
            setUploadingSide(null);
        }
    };

    const handleSubmit = async () => {
        if (submitting || uploadingSide) return;
        const error = validatePersonalAuthForm(form, phonenumber);
        if (error) {
            Toast.show(error);
            return;
        }
        setSubmitting(true);
        const loadingKey = Toast.loading('提交中', 0);
        try {
            const payload = buildPersonalAuditPayload(form, phonenumber!);
            const res = await submitIdentityAudit(payload);
            if (!isResourceApiOk(res)) {
                Toast.show((res as { msg?: string })?.msg || '提交失败');
                return;
            }
            Toast.success('提交成功');
            navigation.goBack();
        } catch {
            Toast.show('提交失败，请稍后重试');
        } finally {
            Toast.remove(loadingKey);
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
                    <KeyboardDoneAccessory nativeID={detailInputAccessoryViewID} />
                </>
            }>
            <View style={styles.page}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <ScrollView
                        ref={scrollRef}
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        automaticallyAdjustKeyboardInsets
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
                                    <TouchableOpacity
                                        style={styles.authContentImgItem}
                                        activeOpacity={0.7}
                                        disabled={!!uploadingSide}
                                        onPress={() => handlePickIdCard('front')}>
                                        <Image
                                            style={styles.authContentImgItemImg}
                                            source={
                                                frontPreviewUri
                                                    ? { uri: frontPreviewUri }
                                                    : require('@/assets/images/auth/sfz_z.png')
                                            }
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.authContentImgItem}
                                        activeOpacity={0.7}
                                        disabled={!!uploadingSide}
                                        onPress={() => handlePickIdCard('back')}>
                                        <Image
                                            style={styles.authContentImgItemImg}
                                            source={
                                                backPreviewUri
                                                    ? { uri: backPreviewUri }
                                                    : require('@/assets/images/auth/sfz_f.png')
                                            }
                                        />
                                    </TouchableOpacity>
                                </Flex>
                            </View>
                            <View style={[styles.authContent, { paddingBottom: 0 }]}>
                                <Text style={styles.authContentTitle}>认证信息</Text>
                                <View style={styles.formFields}>
                                    <Flex justify="between" align="center" style={styles.formRow}>
                                        <Text style={styles.formLabel}>姓名</Text>
                                        <TextInput
                                            style={styles.formInput}
                                            value={form.name}
                                            onChangeText={text => patchForm('name', text)}
                                            onFocus={scrollFocusedInputIntoView}
                                            placeholder="请输入姓名"
                                            placeholderTextColor="#999999"
                                            returnKeyType="done"
                                            inputAccessoryViewID={nameInputAccessoryViewID}
                                        />
                                    </Flex>
                                    <View style={styles.formDivider} />
                                    <RegionCascader
                                        value={regionValue}
                                        onChange={next => {
                                            setForm(prev => ({
                                                ...prev,
                                                residentialProvince: next.province,
                                                residentialCity: next.city,
                                                residentialDistrict: next.district,
                                                residentialStreet: next.street,
                                            }));
                                        }}>
                                        <TouchableOpacity activeOpacity={0.7} style={styles.formRow}>
                                            <Flex justify="between" align="center" style={{ flex: 1 }}>
                                                <Text style={styles.formLabel}>居住地区</Text>
                                                <Flex style={styles.formValueWrap} align="center">
                                                    <Text
                                                        style={[
                                                            styles.formValueText,
                                                            !regionLabel && styles.formPlaceholder,
                                                        ]}
                                                        numberOfLines={1}>
                                                        {regionLabel || '请选择省/市/区县/街道'}
                                                    </Text>
                                                    <Image
                                                        style={styles.formInputIcon}
                                                        source={require('@/assets/images/family/icon_right.png')}
                                                    />
                                                </Flex>
                                            </Flex>
                                        </TouchableOpacity>
                                    </RegionCascader>
                                    <View style={styles.formDivider} />
                                    <Flex justify="between" align="center" style={styles.formRow}>
                                        <Text style={styles.formLabel}>详细地址</Text>
                                        <TextInput
                                            style={styles.formInput}
                                            value={form.residentialDetail}
                                            onChangeText={text => patchForm('residentialDetail', text)}
                                            onFocus={scrollFocusedInputIntoView}
                                            placeholder="小区/门牌号，最多50字"
                                            placeholderTextColor="#999999"
                                            maxLength={50}
                                            returnKeyType="done"
                                            inputAccessoryViewID={detailInputAccessoryViewID}
                                        />
                                    </Flex>
                                    <View style={styles.formDivider} />
                                    <Flex justify="between" align="center" style={styles.formRow}>
                                        <Text style={styles.formLabel}>身份证号</Text>
                                        <TextInput
                                            style={styles.formInput}
                                            value={form.idCard}
                                            onChangeText={text => patchForm('idCard', text)}
                                            onFocus={scrollFocusedInputIntoView}
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
                        style={[styles.primaryBtn, (submitting || uploadingSide) && { opacity: 0.6 }]}
                        disabled={submitting || !!uploadingSide}
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
