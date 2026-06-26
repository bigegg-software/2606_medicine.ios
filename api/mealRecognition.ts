import request from '@/utils/axios';
import * as FileSystem from 'expo-file-system/legacy';
import type { ApiResult } from '@/src/utils/apiHelpers';

export type FoodIdentifyItem = {
    mealName?: string;
    calorie?: number | string;
    protein?: number | string;
    fat?: number | string;
    carbs?: number | string;
    fiber?: number | string;
    amount?: number;
    unit?: string;
    servingUnit?: number | string;
    weight?: number;
    mealCategory?: number;
    othersNutrition?: Record<string, unknown>;
};

export type FoodIdentifyData = {
    ossUrl?: string;
    ossId?: number;
    foodIdentifyId?: number;
    analysisResult?: FoodIdentifyItem[];
};

export type FoodIdentifyResult = ApiResult<FoodIdentifyData>;

const EMPTY_FOOD_IDENTIFY_FILE = `${FileSystem.cacheDirectory}food_identify_empty.bin`;
let emptyFileUriPromise: Promise<string> | null = null;

async function getEmptyFileUri() {
    if (!emptyFileUriPromise) {
        emptyFileUriPromise = (async () => {
            const info = await FileSystem.getInfoAsync(EMPTY_FOOD_IDENTIFY_FILE);
            if (!info.exists) {
                await FileSystem.writeAsStringAsync(EMPTY_FOOD_IDENTIFY_FILE, '', {
                    encoding: FileSystem.EncodingType.UTF8,
                });
            }
            return EMPTY_FOOD_IDENTIFY_FILE;
        })();
    }
    return emptyFileUriPromise;
}

function appendFoodIdentifyFile(
    form: FormData,
    uri: string,
    name: string,
    type = 'application/octet-stream',
) {
    form.append('file', {
        uri,
        type,
        name,
    } as unknown as Blob);
}

export function uploadFoodIdentifyImage(uri: string, text?: string) {
    const form = new FormData();
    appendFoodIdentifyFile(form, uri, 'photo.jpg', 'image/jpeg');
    form.append('text', text?.trim() ?? '');

    return request.post<FoodIdentifyResult>('/patient/fitpulse/foodIdentify/add', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

export async function uploadFoodIdentifyText(text: string) {
    const emptyUri = await getEmptyFileUri();
    const form = new FormData();
    appendFoodIdentifyFile(form, emptyUri, 'empty.bin');
    form.append('text', text.trim());

    return request.post<FoodIdentifyResult>('/patient/fitpulse/foodIdentify/add', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}
