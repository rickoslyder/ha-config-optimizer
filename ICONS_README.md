# Icon Generation

This directory contains source SVG files for generating the required addon icons.

## Required Icons

Home Assistant addons need:
- `icon.png` - 128x128px square icon 
- `logo.png` - 250x100px rectangular logo

## Source Files

- `icon_source.svg` - Source for the 128x128 icon
- `logo_source.svg` - Source for the 250x100 logo

## Converting SVG to PNG

You can convert these using various tools:

### Using Inkscape (recommended)
```bash
# Install Inkscape first
brew install inkscape  # macOS
# or
sudo apt install inkscape  # Ubuntu

# Convert icon
inkscape --export-type=png --export-filename=icon.png --export-width=128 --export-height=128 icon_source.svg

# Convert logo  
inkscape --export-type=png --export-filename=logo.png --export-width=250 --export-height=100 logo_source.svg
```

### Using rsvg-convert
```bash
# Install librsvg
brew install librsvg  # macOS

# Convert icon
rsvg-convert -w 128 -h 128 icon_source.svg > icon.png

# Convert logo
rsvg-convert -w 250 -h 100 logo_source.svg > logo.png
```

### Online Conversion
You can also use online SVG to PNG converters:
- https://cloudconvert.com/svg-to-png
- https://convertio.co/svg-png/

## Icon Design

The icons feature:
- **Icon**: Robot head with antenna representing AI, code lines representing configuration, Home Assistant blue color scheme
- **Logo**: Same robot design with professional text layout and gradient background
- **Colors**: Home Assistant blue (#03a9f4) with complementary shades
- **Style**: Modern, clean, professional appearance suitable for the HA ecosystem

The design emphasizes the AI-powered nature of the addon while maintaining the Home Assistant visual identity.