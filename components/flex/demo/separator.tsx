import React from 'react';
import { Button, Divider, Flex, Typography } from 'antd';

const App: React.FC = () => (
  <Flex vertical gap="middle">
    <Flex separator={<Divider type="vertical" />}>
      <Typography.Link>Link</Typography.Link>
      <Typography.Link>Link</Typography.Link>
      <Typography.Link>Link</Typography.Link>
    </Flex>
    <Flex separator="|" gap="middle">
      <Button type="primary">Primary</Button>
      <Button>Default</Button>
      <Button type="dashed">Dashed</Button>
    </Flex>
    <Flex vertical separator={<Divider style={{ margin: 0 }} />}>
      <Button type="primary">Primary</Button>
      <Button>Default</Button>
      <Button type="dashed">Dashed</Button>
    </Flex>
  </Flex>
);

export default App;
