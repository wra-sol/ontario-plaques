# Ontario Plaques Component System

A collection of reusable UI components built with React and TypeScript. These components enforce the design system: **hard lines, no shadows, no rounding, modern, monospaced, tight spacing.**

## Design Tokens (CSS Variables)

```css
--green: #198f3a;   /* Kelly green */
--dark: #222222;    /* Dark gray */
--mid: #757575;     /* Medium gray */
--light: #f2f2f2;   /* Light gray */
--white: #ffffff;
--gap: 8px;         /* Base spacing unit */
```

## Components

### Button

Primary and secondary button styles with support for internal links, external links, and button elements.

```tsx
import { Button } from '../components';

// Internal navigation
<Button to="/plaques">Browse Plaques</Button>

// External link
<Button href="https://example.com" variant="secondary">Visit Site</Button>

// Form submission
<Button type="submit">Apply Filters</Button>
```

**Props:**
- `variant?: 'primary' | 'secondary'` - Button style (default: 'primary')
- `to?: string` - Internal route (uses React Router Link)
- `href?: string` - External URL (opens in new tab)
- `type?: 'button' | 'submit' | 'reset'` - Button type
- `onClick?: () => void` - Click handler
- `className?: string` - Additional CSS classes
- `style?: CSSProperties` - Inline styles

### Tag

Small labels for categorization and metadata display.

```tsx
import { Tag } from '../components';

<Tag>Architecture</Tag>
<Tag variant="solid">MATCH: title</Tag>
<Tag style={{ fontSize: '0.85rem' }}>Custom Size</Tag>
```

**Props:**
- `variant?: 'default' | 'solid' | 'match'` - Tag style
  - `default`: Light background with green border
  - `solid`: Green background with white text
- `className?: string` - Additional CSS classes
- `style?: CSSProperties` - Inline styles

### Card

Container component with consistent border styling.

```tsx
import { Card } from '../components';

<Card>
  <h1>Title</h1>
  <p>Content</p>
</Card>

<Card as="article">Article content</Card>
```

**Props:**
- `as?: 'div' | 'section' | 'article' | 'aside'` - HTML element (default: 'div')
- `className?: string` - Additional CSS classes
- `style?: CSSProperties` - Inline styles

### Box

Flexible layout container with utility props for common patterns.

```tsx
import { Box } from '../components';

// Card with border and background
<Box border bg="light" p={20}>Content</Box>

// Left accent bar
<Box border borderLeft bg="light" p={20}>
  Highlighted content
</Box>
```

**Props:**
- `as?: string` - HTML element (default: 'div')
- `border?: boolean` - Add 3px solid border
- `borderColor?: 'dark' | 'green'` - Border color (default: 'dark')
- `borderLeft?: boolean` - Add thicker left border (with green color)
- `borderLeftWidth?: number` - Left border width in px (default: 6)
- `bg?: 'light' | 'white'` - Background color
- `p?: number` - Padding in px
- `mb?: number` - Margin bottom in px
- `mt?: number` - Margin top in px
- `className?: string` - Additional CSS classes
- `style?: CSSProperties` - Inline styles

### Input & Select

Form inputs with optional labels.

```tsx
import { Input, Select } from '../components';

<Input
  id="search"
  name="q"
  label="Search"
  placeholder="Enter keywords..."
/>

<Select
  id="region"
  name="region"
  label="Region"
>
  <option value="">All Regions</option>
  <option value="eastern">Eastern</option>
</Select>
```

**Input Props:**
- Extends all standard HTML input attributes
- `label?: string` - Label text
- `labelClassName?: string` - Label CSS classes

**Select Props:**
- Extends all standard HTML select attributes
- `label?: string` - Label text
- `labelClassName?: string` - Label CSS classes

### Stack

Flexbox layout for arranging items in rows or columns with consistent spacing.

```tsx
import { Stack } from '../components';

<Stack gap={16}>
  <p>Item 1</p>
  <p>Item 2</p>
</Stack>

<Stack direction="row" gap={8} wrap align="center">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</Stack>
```

**Props:**
- `direction?: 'row' | 'column'` - Flex direction (default: 'column')
- `gap?: number | string` - Gap between items (default: 8)
- `align?: string` - align-items value
- `justify?: string` - justify-content value
- `wrap?: boolean` - Enable flex-wrap
- `className?: string` - Additional CSS classes
- `style?: CSSProperties` - Inline styles

### Grid

CSS Grid layout with automatic responsive columns.

```tsx
import { Grid } from '../components';

<Grid>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>

<Grid columns={4} gap={24}>
  {items.map(item => <div key={item.id}>{item.name}</div>)}
</Grid>
```

**Props:**
- `columns?: number | string` - Grid columns (default: auto-fill minmax(260px, 1fr))
- `gap?: number | string` - Gap between items (default: 16)
- `className?: string` - Additional CSS classes
- `style?: CSSProperties` - Inline styles

### Image

Image component with consistent border styling and object-fit control.

```tsx
import { Image } from '../components';

<Image
  src="/photo.jpg"
  alt="Historical site"
  height={200}
/>

<Image
  src="/photo.jpg"
  alt="Portrait"
  objectFit="contain"
  border={false}
/>
```

**Props:**
- `src: string` - Image source
- `alt: string` - Alt text
- `width?: string | number` - Width (default: '100%')
- `height?: string | number` - Height (default: 'auto')
- `objectFit?: 'cover' | 'contain' | 'fill' | 'none'` - Object fit (default: 'cover')
- `border?: boolean` - Add border (default: true)
- `className?: string` - Additional CSS classes
- `style?: CSSProperties` - Inline styles

### Text

Typography component with size and color utilities.

```tsx
import { Text } from '../components';

<Text size="small" color="mid">
  Metadata or secondary text
</Text>

<Text size="large" weight={500}>
  Prominent text
</Text>

<Text italic color="green">
  Emphasized text
</Text>
```

**Props:**
- `size?: 'small' | 'base' | 'large'` - Text size (default: 'base')
- `color?: 'dark' | 'mid' | 'green' | 'inherit'` - Text color
- `weight?: number` - Font weight
- `italic?: boolean` - Italic style
- `className?: string` - Additional CSS classes
- `style?: CSSProperties` - Inline styles

## Usage Examples

### Plaque Card

```tsx
<Card as="article">
  <Image src={plaque.imageUrl} alt={plaque.title} height={200} />
  
  <h3 style={{ color: 'var(--green)' }}>{plaque.title}</h3>
  
  <Stack gap={8}>
    <Text size="small">
      <strong>{plaque.municipality}</strong>
      {plaque.year && ` • Established ${plaque.year}`}
    </Text>
  </Stack>
  
  <Stack direction="row" gap={6} wrap>
    {plaque.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
  </Stack>
  
  <Button to={`/plaques/${plaque.id}`}>Read More →</Button>
</Card>
```

### Search Form

```tsx
<Card>
  <Form method="get">
    <Stack gap={16}>
      <Input
        name="q"
        label="Search"
        placeholder="Search plaques..."
      />
      
      <Grid columns="repeat(auto-fit, minmax(200px, 1fr))" gap={16}>
        <Select name="municipality" label="Municipality">
          <option value="">All</option>
        </Select>
        <Select name="region" label="Region">
          <option value="">All</option>
        </Select>
      </Grid>
      
      <Stack direction="row" gap={8}>
        <Button type="submit">Apply Filters</Button>
        <Button variant="secondary" to="/plaques">Clear</Button>
      </Stack>
    </Stack>
  </Form>
</Card>
```

## Design Principles

1. **Hard Lines**: All borders are 2-3px solid, no border-radius
2. **No Shadows**: box-shadow is never used
3. **Monospaced**: ui-monospace font family throughout
4. **Tight Spacing**: 8px base gap, minimal padding
5. **High Contrast**: Clear visual hierarchy with color
6. **Composable**: Mix components freely for complex layouts

