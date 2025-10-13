import { Card, Box, Text, Stack } from "../components";

export default function About() {
  return (
    <Card as="section">
      <h1 style={{ fontSize: '2rem', marginBottom: 24 }}>About This Project</h1>
      
      <Stack gap={20}>
        <Box border bg="light" p={20} borderLeft>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 12, color: 'var(--green)' }}>
            Our Mission
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: '1rem' }}>
            This is a passion project dedicated to providing better access to Ontario's rich collection 
            of historical plaques. We believe that making these stories more discoverable helps preserve 
            and celebrate our shared heritage.
          </p>
        </Box>

        <Box border bg="light" p={20} borderLeft>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 12, color: 'var(--green)' }}>
            Data Source
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: '1rem' }}>
            As of October 2025, data was sourced from{' '}
            <a 
              href="https://www.ontarioplaques.com" 
              target="_blank" 
              rel="noreferrer"
              style={{ color: 'var(--green)', fontWeight: 600 }}
            >
              Ontario Plaques
            </a>
            . Since then, data has been manually curated and enhanced where needed.
          </p>
        </Box>

        <Box border bg="light" p={20} borderLeft>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 12, color: 'var(--green)' }}>
            Get In Touch
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: '1rem' }}>
            If you have any questions, feedback, or suggestions for improvement, please{' '}
            <a 
              href="mailto:ontarioplagues@wrasol.com"
              style={{ color: 'var(--green)', fontWeight: 600 }}
            >
              contact us
            </a>
            . We'd love to hear from you!
          </p>
        </Box>

        <div style={{ marginTop: 24, padding: '16px', backgroundColor: 'var(--light)', textAlign: 'center' }}>
          <Text size="small" color="mid">
            Built with care for Ontario's history
          </Text>
        </div>
      </Stack>
    </Card>
  );
}
