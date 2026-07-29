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
    InteractionManager,
    findNodeHandle,
    type FocusEvent,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';
import RegionCascader from '@/src/components/RegionCascader';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import styles from '@/css/auth/auth';
import { Flex, Toast } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { submitIdentityAudit } from '@/api/identityAudit';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import { regionSelectionFromParts } from '@/src/utils/regionData';
import { consumePendingIdCardCapture } from '@/src/utils/idCardCaptureSession';
import type { RootStackParamList } from '@/route/router';
import {
    buildPersonalAuditPayload,
    formatRegionLabel,
    identifyIdCardImage,
    normalizeIdCardIdentifyResult,
    pickIdCardImageFromLibrary,
    validatePersonalAuthForm,
    type IdCardSide,
    type PersonalAuthForm,
    type PickedIdCardImage,
} from './utils/identityAuditHelpers';

const DESIGN_RATIO = 335 / 90;

const EMPTY_FORM: PersonalAuthForm = {
    name: '',
    idCard: '',
    residentialProvince: '',
    residentialCity: '',
    residentialDistrict: '',
    residentialStreet: '',
    residentialDetail: '',
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AuthPage() {
    const navigation = useNavigation<Nav>();
    const scrollRef = useRef<ScrollView>(null);
    const phonenumber = useSelector((s: RootState) => s.user.systemUser?.phonenumber);
    const [imgWidth, setImgWidth] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingSide, setUploadingSide] = useState<IdCardSide | null>(null);
    const [form, setForm] = useState<PersonalAuthForm>(EMPTY_FORM);
    const [frontPreviewUri, setFrontPreviewUri] = useState('');
    const [backPreviewUri, setBackPreviewUri] = useState('');
    const [sourcePickerSide, setSourcePickerSide] = useState<IdCardSide | null>(null);
    /** 弹窗完全关闭后再打开系统相册，避免 Modal 叠层导致相册打不开 */
    const pendingAlbumSideRef = useRef<IdCardSide | null>(null);

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

    const clearSidePreview = useCallback((side: IdCardSide) => {
        if (side === 'front') {
            setFrontPreviewUri('');
            setForm(prev => ({ ...prev, idCardFrontOssId: undefined }));
            return;
        }
        setBackPreviewUri('');
        setForm(prev => ({ ...prev, idCardBackOssId: undefined }));
    }, []);

    const processIdCardImage = useCallback(async (side: IdCardSide, file: PickedIdCardImage) => {
        if (side === 'front') {
            setFrontPreviewUri(file.uri);
        } else {
            setBackPreviewUri(file.uri);
        }

        setUploadingSide(side);
        const loadingKey = Toast.loading('识别中', 0);
        try {
            const identified = await identifyIdCardImage(file);
            const normalized = identified ? normalizeIdCardIdentifyResult(identified, file.uri) : null;
            if (!normalized) {
                Toast.show('识别失败，请稍后重试');
                clearSidePreview(side);
                return;
            }

            if (side === 'front') {
                setFrontPreviewUri(normalized.previewUrl);
                setForm(prev => {
                    const next = { ...prev, idCardFrontOssId: normalized.ossId };
                    if (normalized.name) next.name = normalized.name;
                    if (normalized.idCard) next.idCard = normalized.idCard;
                    if (normalized.address) {
                        next.residentialDetail =
                            normalized.address.length > 50
                                ? normalized.address.slice(0, 50)
                                : normalized.address;
                    }
                    return next;
                });
            } else {
                setBackPreviewUri(normalized.previewUrl);
                setForm(prev => ({ ...prev, idCardBackOssId: normalized.ossId }));
            }
            Toast.success('识别成功');
        } catch {
            Toast.show('识别失败，请稍后重试');
            clearSidePreview(side);
        } finally {
            Toast.remove(loadingKey);
            setUploadingSide(null);
        }
    }, [clearSidePreview]);

    const handlePickFromAlbum = useCallback(async (side: IdCardSide) => {
        if (uploadingSide || submitting) return;
        const file = await pickIdCardImageFromLibrary(side);
        if (!file) return;
        await processIdCardImage(side, file);
    }, [processIdCardImage, submitting, uploadingSide]);

    const handlePickIdCard = useCallback((side: IdCardSide) => {
        if (uploadingSide || submitting) return;
        setSourcePickerSide(side);
    }, [submitting, uploadingSide]);

    const closeSourcePicker = useCallback(() => {
        pendingAlbumSideRef.current = null;
        setSourcePickerSide(null);
    }, []);

    const handleSourceCamera = useCallback(() => {
        if (!sourcePickerSide) return;
        const side = sourcePickerSide;
        pendingAlbumSideRef.current = null;
        setSourcePickerSide(null);
        navigation.navigate('IdCardCameraPage', { side });
    }, [navigation, sourcePickerSide]);

    const handleSourceAlbum = useCallback(() => {
        if (!sourcePickerSide) return;
        pendingAlbumSideRef.current = sourcePickerSide;
        setSourcePickerSide(null);
    }, [sourcePickerSide]);

    const handleSourcePickerDismissed = useCallback(() => {
        const side = pendingAlbumSideRef.current;
        if (!side) return;
        pendingAlbumSideRef.current = null;
        InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
                void handlePickFromAlbum(side);
            }, 300);
        });
    }, [handlePickFromAlbum]);

    useFocusEffect(
        useCallback(() => {
            const pending = consumePendingIdCardCapture();
            if (!pending) return;
            void processIdCardImage(pending.side, {
                uri: pending.uri,
                name: pending.name,
                type: pending.type,
            });
        }, [processIdCardImage]),
    );

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
            keyboardAccessory={<KeyboardDoneAccessory />}>
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
                                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
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
                                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
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
                                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
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

            <BottomSheetModal
                visible={sourcePickerSide != null}
                onClose={closeSourcePicker}
                onDismissed={handleSourcePickerDismissed}
                sheetStyle={styles.sourceSheet}>
                <Text style={styles.sourceSheetTitle}>上传身份证</Text>
                <Flex justify="center" style={styles.sourceSheetRow}>
                    <TouchableOpacity
                        style={styles.sourceSheetItem}
                        activeOpacity={0.8}
                        onPress={handleSourceCamera}>
                        <View style={styles.sourceSheetDash}>
                            <Image
                                source={require('@/assets/images/case/icon_camera.png')}
                                style={styles.sourceSheetIcon}
                            />
                            <Text style={styles.sourceSheetItemTitle}>拍照识别</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.sourceSheetItem}
                        activeOpacity={0.8}
                        onPress={handleSourceAlbum}>
                        <View style={styles.sourceSheetDash}>
                            <Image
                                source={require('@/assets/images/case/icon_image.png')}
                                style={styles.sourceSheetIcon}
                            />
                            <Text style={styles.sourceSheetItemTitle}>上传照片</Text>
                        </View>
                    </TouchableOpacity>
                </Flex>
                <TouchableOpacity
                    style={styles.sourceSheetCancel}
                    activeOpacity={0.7}
                    onPress={closeSourcePicker}>
                    <Text style={styles.sourceSheetCancelText}>取消</Text>
                </TouchableOpacity>
            </BottomSheetModal>
        </PageLayout>
    );
}
