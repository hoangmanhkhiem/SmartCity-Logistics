# Phase 1 Updated - WITH Image Choice Support

## Changes from Original Phase 1

### ✅ Added Features:
1. **Image Choice Question Type**
   - Display mode: image_grid
   - Support single/multiple selection
   - Image upload in CMS
   - Mobile renderer component

### ⏱️ Timeline Impact:
- **Original:** 2-2.5 weeks
- **Updated:** 2.5-3 weeks (+0.5 week for image support)

---

## Implementation Details

### 1. Database Schema (NO CHANGES!)

**Reuse existing question types:**
```sql
-- Use 'single_choice' or 'multiple_choice'
-- No ALTER TABLE needed ✅

-- Example question with images:
INSERT INTO survey_questions (
  campaign_id,
  question_text,
  question_type,
  config,
  display_order
) VALUES (
  1,
  'Sản phẩm nào bạn quan tâm nhất?',
  'single_choice',  -- Existing type
  '{
    "display_mode": "image_grid",
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
      }
    ]
  }',
  1
);
```

---

### 2. Backend Changes

#### A. Image Upload Service

```typescript
// src/common/services/upload.service.ts

@Injectable()
export class UploadService {
  constructor(
    @Inject('S3_CLIENT') private s3Client: S3Client,
  ) {}

  async uploadSurveyImage(file: Express.Multer.File): Promise<string> {
    const fileName = `survey-images/${Date.now()}-${file.originalname}`;
    
    // Upload to S3/R2
    await this.s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    }));

    // Return public URL
    return `${process.env.IMAGE_PATH}/${fileName}`;
  }

  async uploadMultipleSurveyImages(
    files: Express.Multer.File[]
  ): Promise<string[]> {
    return Promise.all(
      files.map(file => this.uploadSurveyImage(file))
    );
  }
}
```

#### B. Admin API - Upload Image

```typescript
// src/modules/survey/controllers/survey-admin.controller.ts

@Controller('admin/api/surveys')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SurveyAdminController {
  constructor(
    private readonly uploadService: UploadService,
  ) {}

  @Post('images/upload')
  @Permission('SURVEY_MANAGE')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = await this.uploadService.uploadSurveyImage(file);
    
    return {
      success: true,
      data: { image_url: imageUrl }
    };
  }

  @Post('images/upload-multiple')
  @Permission('SURVEY_MANAGE')
  @UseInterceptors(FilesInterceptor('images', 10))  // Max 10 images
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const imageUrls = await this.uploadService.uploadMultipleSurveyImages(files);
    
    return {
      success: true,
      data: { image_urls: imageUrls }
    };
  }
}
```

#### C. Validation - Question Config

```typescript
// src/modules/survey/validators/question-config.validator.ts

export function validateQuestionConfig(
  questionType: string,
  config: any
): void {
  switch (questionType) {
    case 'single_choice':
    case 'multiple_choice':
      validateChoiceConfig(config);
      break;
    // ... other types
  }
}

function validateChoiceConfig(config: any): void {
  if (!config.options || !Array.isArray(config.options)) {
    throw new BadRequestException('options must be an array');
  }

  // Validate image_grid mode
  if (config.display_mode === 'image_grid') {
    config.options.forEach((option, index) => {
      if (!option.id) {
        throw new BadRequestException(`Option ${index}: id is required`);
      }
      if (!option.label) {
        throw new BadRequestException(`Option ${index}: label is required`);
      }
      if (!option.image_url) {
        throw new BadRequestException(`Option ${index}: image_url is required for image_grid mode`);
      }
      // Validate URL format
      if (!isValidUrl(option.image_url)) {
        throw new BadRequestException(`Option ${index}: invalid image_url`);
      }
    });
  }
}
```

---

### 3. CMS Changes

#### A. Question Builder - Image Mode Toggle

```tsx
// CMS: QuestionBuilder.tsx

function QuestionConfigPanel({ questionType, config, onChange }) {
  const [displayMode, setDisplayMode] = useState(config.display_mode || 'default');
  
  // Show image mode toggle for choice questions
  const supportsImageMode = ['single_choice', 'multiple_choice'].includes(questionType);

  return (
    <ConfigPanel>
      {supportsImageMode && (
        <FormField>
          <Label>Display Mode</Label>
          <RadioGroup 
            value={displayMode}
            onChange={(mode) => {
              setDisplayMode(mode);
              onChange({ ...config, display_mode: mode });
            }}
          >
            <Radio value="default">Text Only</Radio>
            <Radio value="image_grid">Image Grid</Radio>
          </RadioGroup>
        </FormField>
      )}

      {displayMode === 'image_grid' && (
        <ImageGridConfig 
          config={config}
          onChange={onChange}
        />
      )}

      {displayMode === 'default' && (
        <TextChoiceConfig 
          config={config}
          onChange={onChange}
        />
      )}
    </ConfigPanel>
  );
}
```

#### B. Image Grid Options Editor

```tsx
// CMS: ImageGridConfig.tsx

function ImageGridConfig({ config, onChange }) {
  const [options, setOptions] = useState(config.options || []);
  const [uploading, setUploading] = useState(false);

  const handleAddOption = () => {
    const newOption = {
      id: `option_${Date.now()}`,
      label: '',
      image_url: '',
      description: ''
    };
    setOptions([...options, newOption]);
  };

  const handleUploadImage = async (index: number, file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await API.post('/admin/api/surveys/images/upload', formData);
      
      const newOptions = [...options];
      newOptions[index].image_url = response.data.image_url;
      setOptions(newOptions);
      onChange({ ...config, options: newOptions });
      
      notification.success('Tải ảnh thành công');
    } catch (error) {
      notification.error('Lỗi tải ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    onChange({ ...config, options: newOptions });
  };

  const handleUpdateOption = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
    onChange({ ...config, options: newOptions });
  };

  return (
    <ImageGridEditor>
      <FormField>
        <Label>Grid Columns</Label>
        <Select 
          value={config.columns || 2}
          onChange={(e) => onChange({ ...config, columns: parseInt(e.target.value) })}
        >
          <option value={2}>2 columns</option>
          <option value={3}>3 columns</option>
        </Select>
      </FormField>

      <FormField>
        <Label>Image Options</Label>
        <OptionsList>
          {options.map((option, index) => (
            <OptionItem key={option.id}>
              {/* Image preview + upload */}
              <ImageUploadArea>
                {option.image_url ? (
                  <>
                    <ImagePreview src={option.image_url} alt={option.label} />
                    <ChangeImageButton onClick={() => triggerUpload(index)}>
                      Change Image
                    </ChangeImageButton>
                  </>
                ) : (
                  <UploadPlaceholder onClick={() => triggerUpload(index)}>
                    <UploadIcon />
                    <UploadText>Upload Image</UploadText>
                  </UploadPlaceholder>
                )}
                <input
                  ref={el => uploadRefs.current[index] = el}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadImage(index, file);
                  }}
                />
              </ImageUploadArea>

              {/* Label */}
              <Input
                placeholder="Label *"
                value={option.label}
                onChange={(e) => handleUpdateOption(index, 'label', e.target.value)}
              />

              {/* ID (auto-generated, read-only) */}
              <Input
                placeholder="ID"
                value={option.id}
                disabled
              />

              {/* Description (optional) */}
              <TextArea
                placeholder="Description (optional)"
                value={option.description || ''}
                onChange={(e) => handleUpdateOption(index, 'description', e.target.value)}
                rows={2}
              />

              {/* Remove button */}
              <Button 
                variant="danger"
                size="small"
                onClick={() => handleRemoveOption(index)}
              >
                Remove
              </Button>
            </OptionItem>
          ))}
        </OptionsList>

        <AddButton onClick={handleAddOption}>
          + Add Image Option
        </AddButton>
      </FormField>

      {uploading && <LoadingOverlay>Uploading...</LoadingOverlay>}
    </ImageGridEditor>
  );
}
```

---

### 4. Mobile App Changes

#### A. Question Renderer - Detect Image Mode

```tsx
// QuestionRenderer.tsx

export function QuestionRenderer({ question, value, onChange }) {
  const isImageMode = 
    ['single_choice', 'multiple_choice'].includes(question.question_type) &&
    question.config.display_mode === 'image_grid';

  if (isImageMode) {
    return (
      <ImageChoiceRenderer
        config={question.config}
        allowMultiple={question.question_type === 'multiple_choice'}
        value={value}
        onChange={onChange}
      />
    );
  }

  // Default renderers
  switch (question.question_type) {
    case 'single_choice':
      return <SingleChoiceRenderer config={question.config} value={value} onChange={onChange} />;
    case 'multiple_choice':
      return <MultipleChoiceRenderer config={question.config} value={value} onChange={onChange} />;
    // ... other types
  }
}
```

#### B. Image Choice Renderer Component

```tsx
// ImageChoiceRenderer.tsx

import React, { useState } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CheckCircle } from 'react-native-feather';

interface ImageOption {
  id: string;
  label: string;
  image_url: string;
  description?: string;
}

interface Props {
  config: {
    columns: number;
    options: ImageOption[];
  };
  allowMultiple: boolean;
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
}

export function ImageChoiceRenderer({ config, allowMultiple, value, onChange }: Props) {
  const selectedIds = Array.isArray(value) ? value : value ? [value] : [];
  const screenWidth = Dimensions.get('window').width;
  const padding = 16;
  const gap = 12;
  const itemWidth = (screenWidth - (padding * 2) - (gap * (config.columns - 1))) / config.columns;

  const handleSelect = (optionId: string) => {
    if (allowMultiple) {
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
    <View style={styles.container}>
      <View style={[styles.grid, { gap }]}>
        {config.options.map((option) => {
          const isSelected = selectedIds.includes(option.id);

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                { width: itemWidth },
                isSelected && styles.optionSelected
              ]}
              onPress={() => handleSelect(option.id)}
              activeOpacity={0.7}
            >
              {/* Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: option.image_url }}
                  style={styles.image}
                  resizeMode="cover"
                />
                
                {/* Selection badge */}
                {isSelected && (
                  <View style={styles.selectionBadge}>
                    <CheckCircle color="#FFFFFF" width={20} height={20} fill="#00A651" />
                  </View>
                )}
              </View>

              {/* Label */}
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {option.label}
              </Text>

              {/* Description (optional) */}
              {option.description && (
                <Text style={styles.description}>
                  {option.description}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: '#00A651',
    backgroundColor: '#F0F9F4',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  selectionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 4,
  },
  labelSelected: {
    color: '#00A651',
  },
  description: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});
```

---

### 5. Answer Format

**Single selection:**
```json
{
  "answer_value": {
    "selected": "laptop"
  },
  "optional_text": "Vì tôi đang cần laptop mới"
}
```

**Multiple selection:**
```json
{
  "answer_value": {
    "selected": ["laptop", "phone"]
  },
  "optional_text": "Cả 2 đều cần thiết cho công việc"
}
```

---

## Updated Timeline

### Week 1: Backend + Database (SAME)
- Day 1-2: Database schema + migrations
- Day 3: User APIs (GET, POST start)
- Day 4: User APIs (POST answers, POST complete)
- Day 5: Admin APIs (Campaign CRUD)

### Week 2: Admin APIs + CMS
- Day 1: Admin APIs (Question CRUD)
- Day 2: Admin APIs (Stats, Export)
- Day 3: **Image upload API** ⭐
- Day 4-5: CMS (Campaign + Question builder basic)

### Week 2.5-3: CMS Complete + Mobile
- Day 1: **CMS Image Grid Config** ⭐
- Day 2: CMS (Response viewer, Analytics)
- Day 3-4: Mobile (Survey flow, basic renderers)
- Day 5: **Mobile ImageChoiceRenderer** ⭐

### Week 3: Testing + Launch
- Day 1-2: Testing (all question types including image)
- Day 3: Bug fixes + Polish
- Day 4: Deploy + Soft launch

**Total:** **3 weeks** (firm)

---

## Deliverables Update

### Backend:
- ✅ 19 APIs (6 user + 13 admin)
- ✅ **+2 APIs:** Image upload (single + multiple)

### CMS:
- ✅ Campaign management
- ✅ Question builder (8 types + **image_grid variant**)
- ✅ **Image upload UI**
- ✅ Response viewer
- ✅ Analytics + Export

### Mobile:
- ✅ Survey flow
- ✅ 8 question renderers
- ✅ **ImageChoiceRenderer component** ⭐
- ✅ Auto-save + Resume

---

## Testing Checklist

### Image Choice Specific:
- [ ] Upload single image (PNG, JPG, WebP)
- [ ] Upload multiple images at once
- [ ] Image display in mobile (aspect ratio, loading states)
- [ ] Single selection works
- [ ] Multiple selection works
- [ ] Selected state visual feedback
- [ ] Image URLs valid in answers JSON
- [ ] Analytics query works for image options
- [ ] Export CSV includes image URLs

---

## Effort Summary

| Component | Without Image | With Image | Delta |
|-----------|---------------|------------|-------|
| Database | 4 tables | 4 tables | 0 |
| Backend APIs | 19 | 21 (+2 upload) | +2 hours |
| CMS | 3 pages | 3 pages + image UI | +1 day |
| Mobile | 8 renderers | 9 renderers | +1 day |
| **Total** | **2-2.5 weeks** | **3 weeks** | **+0.5 week** |

---

## Risk Mitigation

### Image Upload:
- ✅ File size limit: 5MB
- ✅ Allowed formats: PNG, JPG, JPEG, WebP
- ✅ Image optimization: Compress before upload
- ✅ CDN: Use Cloudflare R2 or S3 with CloudFront

### Mobile Performance:
- ✅ Lazy load images (only visible items)
- ✅ Placeholder while loading
- ✅ Cache images locally
- ✅ Handle network errors gracefully

---

**Ready to proceed with image support!** 🚀
