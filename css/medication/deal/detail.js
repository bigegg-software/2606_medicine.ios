import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { padding: 18, paddingTop: 2, paddingBottom: 40 },
    sectionTitle: { marginLeft: 12, fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary },
    pageBody: { flex: 1 },

    medicationBox: {
        marginTop: 12,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingHorizontal: 20,
        paddingVertical: 18,
        marginBottom: 18
    },
    mealBox: {
        marginBottom: 18,
        width: 95,
        marginRight: 8,
        marginTop: 12,
        padding: 7,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
    },
    mealIcon: {
        width: 24,
        height: 24,
    },
    mealTitle: {
        marginTop: 4,
        fontWeight: 500,
        fontSize: 12,
        textAlign: "center",
        color: "#333333"
    },
    mealText: {
        marginTop: 4,
        fontWeight: 400,
        fontSize: 10,
        color: "#999999"
    },
    mealRow: {
        marginTop: 12,
    },
    mealLeft: {
        fontWeight: 500,
        fontSize: 14,
        color: "#333333"
    },
    mealRight: {
        fontWeight: 400,
        fontSize: 14,
        color: "#999999"
    },
    cfIcon: { width: 20, height: 20, marginRight: 6 },
    cfIconText: { fontWeight: 400, fontSize: 16, color: '#333333' },

    suggestBox: {
        marginTop: 10,
        paddingHorizontal: 26,
        paddingVertical: 12,
        backgroundColor: "rgba(79,134,238,0.04)",
        borderRadius: 18
    },
    aiSuggest: {
        marginTop: 4,
        fontWeight: 400,
        fontSize: 12,
        color: "#999999"
    },

})

export default styles;
