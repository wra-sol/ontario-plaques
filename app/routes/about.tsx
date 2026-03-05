import { Card, Box, Text, Stack, Button } from "../components";
import type { MetaFunction } from 'react-router';
import { buildMeta } from '../lib/seo';

export default function About() {
  return (
    <Stack gap={32}>
      {/* Header Section */}
      <Card as="section">
        <div style={{ textAlign: 'center', padding: 'var(--space-5) 0' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-3)' }}>
            About This Project
          </h1>
          <Text size="large" color="secondary">
            Preserving Ontario's stories, one plaque at a time.
          </Text>
        </div>
      </Card>

      {/* Mission Section */}
      <Card as="section" hoverable>
        <Box border bg="light" p={24} borderLeft>
          <Stack gap={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: '2rem' }} aria-hidden="true">📜</span>
              <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--accent)', margin: 0 }}>
                Our Mission
              </h2>
            </div>
            <p style={{ lineHeight: 1.8, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
              This is a passion project dedicated to providing better access to Ontario's rich collection 
              of historical plaques. We believe that making these stories more discoverable helps preserve 
              and celebrate our shared heritage. Every plaque tells a story—of the people, places, and events 
              that shaped our province.
            </p>
            <p style={{ lineHeight: 1.8, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
              From early Indigenous settlements to industrial innovations, from famous figures to 
              forgotten heroes, these plaques connect us to our past and help us understand our present.
            </p>
          </Stack>
        </Box>
      </Card>

      {/* Data Source Section */}
      <Card as="section" hoverable>
        <Box border bg="light" p={24} borderLeft>
          <Stack gap={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: '2rem' }} aria-hidden="true">🔍</span>
              <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--accent)', margin: 0 }}>
                Data & Sources
              </h2>
            </div>
            <p style={{ lineHeight: 1.8, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
              The original data was sourced from{' '}
              <a 
                href="https://www.ontarioplaques.com" 
                target="_blank" 
                rel="noreferrer"
                style={{ color: 'var(--accent)', fontWeight: 600 }}
              >
                Ontario Plaques
              </a>
              , an invaluable resource maintained by enthusiasts for decades. 
              Since then, we have:
            </p>
            <ul style={{ 
              marginLeft: 'var(--space-5)', 
              lineHeight: 1.8,
              color: 'var(--text-primary)',
              listStyle: 'none',
              padding: 0
            }}>
              <li style={{ marginBottom: 'var(--space-2)', position: 'relative', paddingLeft: 'var(--space-4)' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--accent)' }}>✓</span>
                Manually curated and enhanced metadata
              </li>
              <li style={{ marginBottom: 'var(--space-2)', position: 'relative', paddingLeft: 'var(--space-4)' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--accent)' }}>✓</span>
                Improved search and filtering capabilities
              </li>
              <li style={{ marginBottom: 'var(--space-2)', position: 'relative', paddingLeft: 'var(--space-4)' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--accent)' }}>✓</span>
                Added mobile-responsive design
              </li>
              <li style={{ position: 'relative', paddingLeft: 'var(--space-4)' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--accent)' }}>✓</span>
                Optimized images for faster loading
              </li>
            </ul>
          </Stack>
        </Box>
      </Card>

      {/* Stats Section */}
      <Card as="section">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--space-4)',
          padding: 'var(--space-4)'
        }}>
          {[
            { value: '1000+', label: 'Historical Plaques', icon: '📍' },
            { value: '100+', label: 'Municipalities', icon: '🏛️' },
            { value: '24/7', label: 'Available', icon: '🌐' },
            { value: 'Free', label: 'Forever', icon: '❤️' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }} aria-hidden="true">
                {stat.icon}
              </div>
              <div style={{ 
                fontSize: 'var(--text-2xl)', 
                fontWeight: 700, 
                color: 'var(--accent)',
                marginBottom: 'var(--space-1)'
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Contact Section */}
      <Card as="section" hoverable>
        <Box border bg="light" p={24} borderLeft>
          <Stack gap={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: '2rem' }} aria-hidden="true">📬</span>
              <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--accent)', margin: 0 }}>
                Get In Touch
              </h2>
            </div>
            <p style={{ lineHeight: 1.8, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
              Have questions, feedback, or suggestions? Found a mistake or missing plaque? 
              We'd love to hear from you! Your input helps make this resource better for everyone.
            </p>
            <Stack direction="row" gap={12} wrap>
              <Button href="mailto:ontarioplagues@wrasol.com">
                ✉️ Contact Us
              </Button>
              <Button href="https://github.com/wra-sol/ontario-plaques" variant="secondary">
                🐙 View on GitHub
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Card>

      {/* Footer Note */}
      <div style={{ 
        textAlign: 'center',
        padding: 'var(--space-4)',
        border: 'var(--border-thick) solid var(--border-primary)',
        background: 'var(--bg-primary)'
      }}>
        <Text size="small" color="secondary">
          Built with care for Ontario's history · Open source · Community driven
        </Text>
      </div>
    </Stack>
  );
}

export const meta: MetaFunction = ({ location }) => {
  return buildMeta({
    title: 'About',
    description: 'Learn about the Ontario Historical Plaques project, our mission, data sources, and how to get in touch.',
    pathname: location.pathname,
  });
};
