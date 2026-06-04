import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    scroll: { padding: 18, paddingTop: 0, paddingBottom: 40 },
    sectionBox: {
        marginTop: 8,
        backgroundColor: '#FEFFFF',
        shadowColor: '#0C3D9A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        borderRadius: 8,
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    rowLine: { height: 1, backgroundColor: '#E8DED2', width: "100%" },
    sectionTitle: { marginTop: 18, fontWeight: 500, fontSize: 16, color: AppTheme.textPrimary, lineHeight: 19, },
    sectionDesc: { marginTop: 6, fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary, lineHeight: 20 },
    optionBox: { width: '30%', height: 33, paddingHorizontal: 30, backgroundColor: 'rgba(5,58,147,0.14)', borderRadius: 8 },
    optionBoxThird: { width: '31%', height: 33, marginBottom: 10, paddingHorizontal: 6, backgroundColor: 'rgba(5,58,147,0.14)', borderRadius: 8, alignItems: 'center', justifyContent: 'center', },
    optionRowWrap: { width: '100%' },
    optionBoxActive: { backgroundColor: '#053A93' },
    optionText: { fontWeight: 500, fontSize: 14, color: '#053A93' },
    optionTextSm: { fontWeight: 500, fontSize: 12, color: '#053A93', textAlign: 'center' },
    optionTextActive: { color: '#FFFFFF' },
    previewBox: { marginTop: 18, padding: 16, borderRadius: 8, backgroundColor: 'rgba(5,58,147,0.14)', },
    previewLabel: { fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary, marginBottom: 8 },
    previewText: { fontWeight: 400, color: AppTheme.textPrimary, lineHeight: 19 },
    imgBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EBF0FB", },
    imgItem: { width: 24, height: 24 },
    itemText: { marginLeft: 12, fontWeight: 400, fontSize: 16, color: AppTheme.textPrimary, },
    delText: { fontWeight: 500, fontSize: 16, color: AppTheme.primaryColor, },
    rowTitle: { fontWeight: 400, fontSize: 16, color: "#333333" }
});

export default styles;
