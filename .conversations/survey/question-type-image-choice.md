# Question Type: Image Choice

## Overview
Cho phép user chọn 1 hoặc nhiều hình ảnh từ grid layout.

**Use cases:**
- Chọn sản phẩm yêu thích
- Chọn features quan tâm (với icon/illustration)
- Visual preference survey

---

## Database Schema Update

### Option A: Add to existing ENUM (requires migration)
```sql
ALTER TABLE survey_questions 
MODIFY COLUMN question_type ENUM(
    'nps',
    'rating_scale',
    'feature_matrix',
    'single_choice',
    'multiple_choice',
    'ranking',
    'text_short',
    'text_long',
    'image_choice'  -- NEW
) NOT NULL;
```

### Option B: Use existing type (no migration)
Dùng `single_choice` hoặc `multiple_choice` với image URLs trong config.

**Recommendation:** Option B cho Phase 1 (tránh migration)

---

## Config Structure

```json
{
  "question_type": "single_choice",  // or "multiple_choice"
  "config": {
    "display_mode": "image_grid",  // Special mode
    "allow_multiple": false,        // true for multiple selection
    "columns": 2,                   // Grid columns (2 or 3)
    
    "options": [
      {
        "id": "product_1",
        "label": "Sản phẩm A",
        "image_url": "https://images.piggi.me/product-a.jpg",
        "description": "Mô tả ngắn (optional)"
      },
      {
        "id": "product_2",
        "label": "Sản phẩm B",
        "image_url": "https://images.piggi.me/product-b.jpg"
      },
      {
        "id": "product_3",
        "label": "Sản phẩm C",
        "image_url": "https://images.piggi.me/product-c.jpg"
      }
    ]
  },
  "enable_optional_text": true,
  "optional_text_placeholder": "Tại sao bạn chọn sản phẩm này?"
}
```

---

## Answer Format

**Single selection:**
```json
{
  "answer_value": {
    "selected": "product_1"
  },
  "optional_text": "Vì sản phẩm A chất lượng tốt"
}
```

**Multiple selection:**
```json
{
  "answer_value": {
    "selected": ["product_1", "product_3"]
  },
  "optional_text": "Cả 2 đều phù hợp với nhu cầu của tôi"
}
```

---

## Mobile Component

```tsx
// ImageChoiceRenderer.tsx

interface ImageOption {
  id: string;
  label: string;
  image_url: string;
  description?: string;
}

interface Props {
  config: {
    display_mode: 'image_grid';
    allow_multiple: boolean;
    columns: number;
    options: ImageOption[];
  };
  value: string | string[];
  onChange: (value: string | string[]) => void;
}

export function ImageChoiceRenderer({ config, value, onChange }: Props) {
  const selectedIds = Array.isArray(value) ? value : value ? [value] : [];
  
  const handleSelect = (optionId: string) => {
    if (config.allow_multiple) {
      // Multiple selection
      const newSelection = selectedIds.includes(optionId)
        ? selectedIds.filter(id => id !== optionId)
        : [...selectedIds, optionId];
      onChange(newSelection);
    } else {
      // Single selection
      onChange(optionId);
    }
  };
  
  return (
    <ImageGrid columns={config.columns}>
      {config.options.map(option => (
        <ImageOption
          key={option.id}
          selected={selectedIds.includes(option.id)}
          onPress={() => handleSelect(option.id)}
        >
          <Image source={{ uri: option.image_url }} />
          
          {/* Selection indicator */}
          {selectedIds.includes(option.id) && (
            <SelectionBadge>
              <CheckIcon />
            </SelectionBadge>
          )}
          
          {/* Label */}
          <Label>{option.label}</Label>
          
          {/* Optional description */}
          {option.description && (
            <Description>{option.description}</Description>
          )}
        </ImageOption>
      ))}
    </ImageGrid>
  );
}
```

---

## Styling

```tsx
// ImageOption component
const ImageOption = styled.TouchableOpacity<{selected: boolean}>`
  border-radius: 12px;
  border: 2px solid ${props => props.selected ? '#00A651' : '#E0E0E0'};
  padding: 12px;
  background: ${props => props.selected ? '#F0F9F4' : '#FFFFFF'};
  position: relative;
`;

const Image = styled.Image`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  margin-bottom: 8px;
`;

const SelectionBadge = styled.View`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: #00A651;
  align-items: center;
  justify-content: center;
`;

const Label = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-align: center;
`;
```

---

## CMS Question Builder

```tsx
// Admin CMS - Question Builder

function ImageChoiceConfig() {
  const [options, setOptions] = useState<ImageOption[]>([]);
  
  return (
    <ConfigPanel>
      <FormField>
        <Label>Display Mode</Label>
        <Select value="image_grid" disabled>
          <Option value="image_grid">Image Grid</Option>
        </Select>
      </FormField>
      
      <FormField>
        <Label>Selection Type</Label>
        <RadioGroup>
          <Radio value={false}>Single selection</Radio>
          <Radio value={true}>Multiple selection</Radio>
        </RadioGroup>
      </FormField>
      
      <FormField>
        <Label>Grid Columns</Label>
        <Select defaultValue={2}>
          <Option value={2}>2 columns</Option>
          <Option value={3}>3 columns</Option>
        </Select>
      </FormField>
      
      <FormField>
        <Label>Image Options</Label>
        <ImageOptionsEditor
          options={options}
          onChange={setOptions}
        />
      </FormField>
    </ConfigPanel>
  );
}

function ImageOptionsEditor({ options, onChange }) {
  const handleAddOption = () => {
    onChange([...options, {
      id: generateId(),
      label: '',
      image_url: '',
      description: ''
    }]);
  };
  
  const handleUploadImage = async (index: number, file: File) => {
    // Upload to S3/Cloudflare R2
    const imageUrl = await uploadImage(file);
    
    const newOptions = [...options];
    newOptions[index].image_url = imageUrl;
    onChange(newOptions);
  };
  
  return (
    <OptionsList>
      {options.map((option, index) => (
        <OptionItem key={option.id}>
          {/* Image upload */}
          <ImageUpload
            value={option.image_url}
            onChange={(file) => handleUploadImage(index, file)}
          />
          
          {/* Label input */}
          <Input
            placeholder="Label"
            value={option.label}
            onChange={(e) => updateOption(index, 'label', e.target.value)}
          />
          
          {/* Description (optional) */}
          <Input
            placeholder="Description (optional)"
            value={option.description}
            onChange={(e) => updateOption(index, 'description', e.target.value)}
          />
          
          {/* Remove button */}
          <Button variant="danger" onClick={() => removeOption(index)}>
            Remove
          </Button>
        </OptionItem>
      ))}
      
      <Button onClick={handleAddOption}>+ Add Image Option</Button>
    </OptionsList>
  );
}
```

---

## Analytics

### Question stats:
```sql
-- Most selected images
SELECT 
  JSON_UNQUOTE(JSON_EXTRACT(answer_value, '$.selected')) as selected_option,
  COUNT(*) as selection_count
FROM survey_answers
WHERE question_id = ?
GROUP BY selected_option
ORDER BY selection_count DESC;

-- For multiple selection:
SELECT 
  option_id,
  COUNT(*) as times_selected
FROM (
  SELECT 
    JSON_UNQUOTE(json_array_element) as option_id
  FROM survey_answers,
    JSON_TABLE(
      answer_value->'$.selected',
      '$[*]' COLUMNS (json_array_element VARCHAR(255) PATH '$')
    ) as jt
  WHERE question_id = ?
) as selections
GROUP BY option_id
ORDER BY times_selected DESC;
```

---

## Example Question

**Question text:** "Sản phẩm nào bạn quan tâm nhất?"

**Config:**
```json
{
  "question_type": "single_choice",
  "config": {
    "display_mode": "image_grid",
    "allow_multiple": false,
    "columns": 2,
    "options": [
      {
        "id": "laptop",
        "label": "Laptop Gaming",
        "image_url": "https://images.piggi.me/laptop.jpg"
      },
      {
        "id": "phone",
        "label": "Smartphone",
        "image_url": "https://images.piggi.me/phone.jpg"
      },
      {
        "id": "headphone",
        "label": "Tai nghe",
        "image_url": "https://images.piggi.me/headphone.jpg"
      },
      {
        "id": "watch",
        "label": "Smartwatch",
        "image_url": "https://images.piggi.me/watch.jpg"
      }
    ]
  },
  "enable_optional_text": true,
  "optional_text_placeholder": "Tại sao bạn quan tâm sản phẩm này?"
}
```

---

## Phase 1 Decision

### Option A: Implement ngay
- Add display_mode="image_grid" vào single_choice/multiple_choice
- Build ImageChoiceRenderer component
- CMS support image upload

**Effort:** +1-2 ngày

### Option B: Defer to Phase 2
- Dùng text-only choices trong Phase 1
- Add image support sau

**Recommendation:** 
- Nếu survey đầu tiên KHÔNG CẦN image choice → **Defer to Phase 2**
- Nếu cần thiết → **Implement ngay** (effort không lớn lắm)

Bạn quyết định nhé!
