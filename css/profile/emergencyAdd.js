import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    relationChipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 9,
        marginTop: 10,
    },
    relationChip: {
        width: 66,
        height: 32,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(102,102,102,0.29)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    relationChipActive: {
        backgroundColor: '#F5F8FF',
        borderColor: '#053A93',
    },
    relationChipText: {
        fontWeight: '400',
        fontSize: 14,
        color: '#333333',
    },
    relationChipTextActive: {
        fontWeight: '500',
        color: '#053A93',
    },
});

export default styles;
