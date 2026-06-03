import { Text, Image } from 'react-native';
import { Flex } from '@ant-design/react-native';
export default function NoData() {
    return (
        <Flex style={{ width: "100%" }} direction='column' justify='center' align='center'>
            <Image style={{ width: 188, height: 90 }} source={require('@/assets/images/common/noData.png')} />
            <Text style={{ textAlign: 'center', fontSize: 16, color: '#999999' }}>暂无紧急联系人，点击下方按钮添加</Text>
        </Flex>
    );
}
