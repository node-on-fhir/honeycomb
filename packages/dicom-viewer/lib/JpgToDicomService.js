// lib/JpgToDicomService.js
import { get } from 'lodash';
import moment from 'moment';

class JpgToDicomService {
  constructor() {
    this.sopClassUID = '1.2.840.10008.5.1.4.1.1.7'; // Secondary Capture Image Storage
    this.implementationClassUID = '1.2.840.10008.1.2.1'; // Explicit VR Little Endian
    this.implementationVersionName = 'METEOR_DICOM_1.0';
  }

  // Generate unique UIDs
  generateUID(prefix = '1.2.826.0.1.3680043.8.498.') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${prefix}${timestamp}.${random}`;
  }

  // FIXED: Calculate required buffer size accurately
  calculateRequiredBufferSize(pixelData, metadata) {
    const headerSize = 1024; // Base header size
    const pixelDataSize = pixelData.length;
    const metadataSize = 2048; // Estimated metadata size
    const padding = 1024; // Safety padding
    
    // Calculate total size with 25% overhead for safety
    const baseSize = headerSize + pixelDataSize + metadataSize + padding;
    const totalSize = Math.ceil(baseSize * 1.25);
    
    console.log('Buffer size calculation:', {
      pixelDataSize: pixelDataSize,
      estimatedTotal: totalSize,
      imageSize: `${metadata.width}x${metadata.height}`
    });
    
    return totalSize;
  }

  // Create DICOM header with proper tags
  createDicomHeader(imageData, metadata = {}) {
    const now = moment();
    const studyUID = this.generateUID();
    const seriesUID = this.generateUID();
    const instanceUID = this.generateUID();
    
    // Extract image dimensions from canvas or metadata
    const width = get(metadata, 'width', 512);
    const height = get(metadata, 'height', 512);
    const samplesPerPixel = get(metadata, 'samplesPerPixel', 1); // Grayscale default
    const bitsAllocated = get(metadata, 'bitsAllocated', 8);
    const bitsStored = get(metadata, 'bitsStored', 8);
    const highBit = get(metadata, 'highBit', 7);
    
    // DICOM Data Elements (Tag, VR, Length, Value)
    const dataElements = {
      // File Meta Information
      '00020001': this.createDataElement('OB', [0x00, 0x01]), // File Meta Information Version
      '00020002': this.createDataElement('UI', this.sopClassUID), // Media Storage SOP Class UID
      '00020003': this.createDataElement('UI', instanceUID), // Media Storage SOP Instance UID
      '00020010': this.createDataElement('UI', '1.2.840.10008.1.2.1'), // Transfer Syntax UID
      '00020012': this.createDataElement('UI', this.implementationClassUID), // Implementation Class UID
      '00020013': this.createDataElement('SH', this.implementationVersionName), // Implementation Version Name
      
      // Patient Module
      '00100010': this.createDataElement('PN', get(metadata, 'patientName', 'ANONYMOUS^PATIENT')), // Patient Name
      '00100020': this.createDataElement('LO', get(metadata, 'patientId', 'ANON001')), // Patient ID
      '00100030': this.createDataElement('DA', get(metadata, 'patientBirthDate', '')), // Patient Birth Date
      '00100040': this.createDataElement('CS', get(metadata, 'patientSex', 'O')), // Patient Sex
      
      // General Study Module
      '0020000D': this.createDataElement('UI', studyUID), // Study Instance UID
      '00080020': this.createDataElement('DA', now.format('YYYYMMDD')), // Study Date
      '00080030': this.createDataElement('TM', now.format('HHmmss.SSS')), // Study Time
      '00080050': this.createDataElement('SH', get(metadata, 'accessionNumber', '')), // Accession Number
      '00080090': this.createDataElement('PN', get(metadata, 'referringPhysician', '')), // Referring Physician
      '00081030': this.createDataElement('LO', get(metadata, 'studyDescription', 'Converted from JPG')), // Study Description
      
      // General Series Module
      '0020000E': this.createDataElement('UI', seriesUID), // Series Instance UID
      '00200011': this.createDataElement('IS', get(metadata, 'seriesNumber', '1')), // Series Number
      '00080060': this.createDataElement('CS', get(metadata, 'modality', 'OT')), // Modality (Other)
      '0008103E': this.createDataElement('LO', get(metadata, 'seriesDescription', 'JPG Conversion Series')), // Series Description
      
      // General Equipment Module
      '00080070': this.createDataElement('LO', 'Meteor DICOM Viewer'), // Manufacturer
      '00081090': this.createDataElement('LO', 'JPG to DICOM Converter'), // Manufacturer Model Name
      '00181020': this.createDataElement('LO', this.implementationVersionName), // Software Version
      
      // General Image Module
      '00200013': this.createDataElement('IS', get(metadata, 'instanceNumber', '1')), // Instance Number
      '00080008': this.createDataElement('CS', 'DERIVED\\SECONDARY'), // Image Type
      '00080016': this.createDataElement('UI', this.sopClassUID), // SOP Class UID
      '00080018': this.createDataElement('UI', instanceUID), // SOP Instance UID
      '00080012': this.createDataElement('DA', now.format('YYYYMMDD')), // Instance Creation Date
      '00080013': this.createDataElement('TM', now.format('HHmmss.SSS')), // Instance Creation Time
      
      // Image Pixel Module
      '00280002': this.createDataElement('US', samplesPerPixel), // Samples per Pixel
      '00280004': this.createDataElement('CS', samplesPerPixel === 1 ? 'MONOCHROME2' : 'RGB'), // Photometric Interpretation
      '00280010': this.createDataElement('US', height), // Rows
      '00280011': this.createDataElement('US', width), // Columns
      '00280100': this.createDataElement('US', bitsAllocated), // Bits Allocated
      '00280101': this.createDataElement('US', bitsStored), // Bits Stored
      '00280102': this.createDataElement('US', highBit), // High Bit
      '00280103': this.createDataElement('US', 0), // Pixel Representation (unsigned)
      '7FE00010': this.createDataElement('OW', imageData), // Pixel Data
    };

    return dataElements;
  }

  // Create a DICOM data element
  createDataElement(vr, value) {
    return {
      vr: vr,
      value: value,
      length: this.calculateValueLength(vr, value)
    };
  }

  // Calculate the length of a value based on VR
  calculateValueLength(vr, value) {
    if (Array.isArray(value)) {
      if (vr === 'OB' || vr === 'OW') {
        return value.length;
      }
      return value.reduce((total, item) => {
        if (typeof item === 'string') {
          return total + this.getStringByteLength(item);
        }
        return total + 1; // For single byte values
      }, 0);
    }
    
    if (typeof value === 'string') {
      const length = this.getStringByteLength(value);
      // DICOM strings must be even length
      return length % 2 === 0 ? length : length + 1;
    }
    
    if (typeof value === 'number') {
      switch (vr) {
        case 'US': // Unsigned Short
        case 'SS': // Signed Short
          return 2;
        case 'UL': // Unsigned Long
        case 'SL': // Signed Long
          return 4;
        default:
          return 2;
      }
    }
    
    return 0;
  }

  // Get byte length of string (accounting for UTF-8)
  getStringByteLength(str) {
    return new TextEncoder().encode(str || '').length;
  }

  // Convert JPG to pixel data
  async convertJpgToPixelData(jpgFile) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = function() {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          
          console.log(`Processing image: ${img.width}x${img.height}`);
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const pixels = imageData.data; // RGBA data
          
          // Convert RGBA to grayscale for DICOM compatibility
          // Use standard luminance formula: Y = 0.299*R + 0.587*G + 0.114*B
          const grayscalePixels = new Uint8Array(pixels.length / 4);
          let grayIndex = 0;
          
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];     // Red
            const g = pixels[i + 1]; // Green
            const b = pixels[i + 2]; // Blue
            // Convert to grayscale using luminance formula
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            grayscalePixels[grayIndex++] = gray;
          }
          
          resolve({
            pixelData: Array.from(grayscalePixels),
            width: img.width,
            height: img.height,
            samplesPerPixel: 1, // Grayscale
            bitsAllocated: 8,
            bitsStored: 8,
            highBit: 7
          });
        } catch (error) {
          reject(error);
        } finally {
          // Cleanup
          URL.revokeObjectURL(img.src);
        }
      };
      
      img.onerror = function(error) {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image: ' + (error.message || 'Unknown error')));
      };
      
      // Create object URL for the image
      const url = URL.createObjectURL(jpgFile);
      img.src = url;
    });
  }

  async convertJpgToPixelData(jpgFile, options = {}) {
    const useRGB = get(options, 'preserveColor', false);
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = function() {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          
          console.log(`Processing image: ${img.width}x${img.height} (${useRGB ? 'RGB' : 'Grayscale'})`);
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const pixels = imageData.data; // RGBA data
          
          let pixelData, samplesPerPixel;
          
          if (useRGB) {
            // Convert RGBA to RGB (remove alpha channel)
            const rgbPixels = new Uint8Array(pixels.length * 3 / 4);
            let rgbIndex = 0;
            
            for (let i = 0; i < pixels.length; i += 4) {
              rgbPixels[rgbIndex++] = pixels[i];     // Red
              rgbPixels[rgbIndex++] = pixels[i + 1]; // Green
              rgbPixels[rgbIndex++] = pixels[i + 2]; // Blue
              // Skip alpha (i + 3)
            }
            
            pixelData = Array.from(rgbPixels);
            samplesPerPixel = 3;
          } else {
            // Convert RGBA to grayscale for better DICOM compatibility
            const grayscalePixels = new Uint8Array(pixels.length / 4);
            let grayIndex = 0;
            
            for (let i = 0; i < pixels.length; i += 4) {
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];
              // Use standard luminance formula
              const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
              grayscalePixels[grayIndex++] = gray;
            }
            
            pixelData = Array.from(grayscalePixels);
            samplesPerPixel = 1;
          }
          
          resolve({
            pixelData: pixelData,
            width: img.width,
            height: img.height,
            samplesPerPixel: samplesPerPixel,
            bitsAllocated: 8,
            bitsStored: 8,
            highBit: 7
          });
        } catch (error) {
          reject(error);
        } finally {
          URL.revokeObjectURL(img.src);
        }
      };
      
      img.onerror = function(error) {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image: ' + (error.message || 'Unknown error')));
      };
      
      const url = URL.createObjectURL(jpgFile);
      img.src = url;
    });
  }

  // FIXED: Build complete DICOM file with dynamic buffer sizing
  async buildDicomFile(dataElements, pixelDataLength, metadata) {
    // Calculate required buffer size accurately
    const requiredSize = this.calculateRequiredBufferSize({ length: pixelDataLength }, metadata);
    const buffer = new ArrayBuffer(requiredSize);
    const view = new DataView(buffer);
    let offset = 0;

    console.log(`Building DICOM file with buffer size: ${requiredSize} bytes`);

    // DICOM File Preamble (128 bytes of 0x00)
    for (let i = 0; i < 128; i++) {
      view.setUint8(offset++, 0x00);
    }

    // DICOM Prefix "DICM"
    const dicmBytes = new TextEncoder().encode('DICM');
    for (let i = 0; i < dicmBytes.length; i++) {
      view.setUint8(offset++, dicmBytes[i]);
    }

    // Write File Meta Information Group
    offset = this.writeDataElements(view, offset, dataElements, true);

    // Write Main Data Set
    offset = this.writeDataElements(view, offset, dataElements, false);

    console.log(`DICOM file built successfully. Final size: ${offset} bytes`);

    // Return the actual used portion of the buffer
    return buffer.slice(0, offset);
  }

  // Write data elements to buffer
  writeDataElements(view, offset, dataElements, isMetaInfo) {
    const tags = Object.keys(dataElements).sort();
    
    for (const tag of tags) {
      const isMetaTag = tag.startsWith('0002');
      
      // Skip meta tags when writing main dataset and vice versa
      if (isMetaInfo !== isMetaTag) continue;
      
      const element = dataElements[tag];
      try {
        offset = this.writeDataElement(view, offset, tag, element);
      } catch (error) {
        console.error(`Error writing element ${tag}:`, error);
        throw new Error(`Failed to write DICOM element ${tag}: ${error.message}`);
      }
    }
    
    return offset;
  }

  // FIXED: Write individual data element with bounds checking
  writeDataElement(view, offset, tag, element) {
    // Check if we have enough space
    const estimatedSpace = 8 + element.length + 4; // Tag + VR + Length + Value
    if (offset + estimatedSpace > view.byteLength) {
      throw new Error(`Buffer overflow: need ${estimatedSpace} bytes at offset ${offset}, buffer size ${view.byteLength}`);
    }

    // Write tag (group, element)
    const group = parseInt(tag.substring(0, 4), 16);
    const elem = parseInt(tag.substring(4, 8), 16);
    
    view.setUint16(offset, group, true); // Little endian
    view.setUint16(offset + 2, elem, true);
    offset += 4;

    // Write VR for Explicit VR
    const vrBytes = new TextEncoder().encode(element.vr);
    view.setUint8(offset++, vrBytes[0]);
    view.setUint8(offset++, vrBytes[1]);

    // Write length
    if (['OB', 'OW', 'OF', 'SQ', 'UN', 'UT'].includes(element.vr)) {
      // Long form length
      view.setUint16(offset, 0, true); // Reserved
      offset += 2;
      view.setUint32(offset, element.length, true);
      offset += 4;
    } else {
      // Short form length
      view.setUint16(offset, element.length, true);
      offset += 2;
    }

    // Write value
    offset = this.writeValue(view, offset, element.vr, element.value);

    return offset;
  }

  // FIXED: Write value based on VR with bounds checking
  writeValue(view, offset, vr, value) {
    if (Array.isArray(value)) {
      if (vr === 'OB' || vr === 'OW') {
        // Binary data - check bounds before writing
        if (offset + value.length > view.byteLength) {
          throw new Error(`Buffer overflow writing binary data: offset ${offset}, length ${value.length}, buffer size ${view.byteLength}`);
        }
        for (let i = 0; i < value.length; i++) {
          view.setUint8(offset++, value[i]);
        }
      } else {
        // Multiple string values
        for (let i = 0; i < value.length; i++) {
          const str = String(value[i]);
          const bytes = new TextEncoder().encode(str);
          for (let j = 0; j < bytes.length; j++) {
            view.setUint8(offset++, bytes[j]);
          }
          if (i < value.length - 1) {
            view.setUint8(offset++, 0x5C); // Backslash delimiter
          }
        }
      }
    } else if (typeof value === 'string') {
      const bytes = new TextEncoder().encode(value);
      for (let i = 0; i < bytes.length; i++) {
        view.setUint8(offset++, bytes[i]);
      }
      // Add padding byte if odd length
      if (bytes.length % 2 === 1) {
        view.setUint8(offset++, 0x20); // Space padding
      }
    } else if (typeof value === 'number') {
      switch (vr) {
        case 'US':
          view.setUint16(offset, value, true);
          offset += 2;
          break;
        case 'UL':
          view.setUint32(offset, value, true);
          offset += 4;
          break;
        case 'SS':
          view.setInt16(offset, value, true);
          offset += 2;
          break;
        case 'SL':
          view.setInt32(offset, value, true);
          offset += 4;
          break;
      }
    }

    return offset;
  }

  // Main conversion method
  async convertJpgToDicom(jpgFile, metadata = {}) {
    try {
      console.log('Converting JPG to DICOM...', jpgFile.name);
      
      // Convert JPG to pixel data
      const imageData = await this.convertJpgToPixelData(jpgFile);
      
      // Merge image dimensions with provided metadata
      const fullMetadata = {
        ...metadata,
        width: imageData.width,
        height: imageData.height,
        samplesPerPixel: imageData.samplesPerPixel,
        bitsAllocated: imageData.bitsAllocated,
        bitsStored: imageData.bitsStored,
        highBit: imageData.highBit
      };
      
      console.log('Image data extracted:', {
        width: imageData.width,
        height: imageData.height,
        pixelDataLength: imageData.pixelData.length
      });
      
      // Create DICOM header
      const dataElements = this.createDicomHeader(imageData.pixelData, fullMetadata);
      
      // Build complete DICOM file with proper buffer sizing
      const dicomBuffer = await this.buildDicomFile(dataElements, imageData.pixelData.length, fullMetadata);
      
      console.log('DICOM conversion completed successfully');
      
      return {
        buffer: dicomBuffer,
        metadata: fullMetadata,
        fileName: jpgFile.name.replace(/\.(jpg|jpeg|png)$/i, '.dcm')
      };
      
    } catch (error) {
      console.error('JPG to DICOM conversion failed:', error);
      throw error;
    }
  }
}



export default new JpgToDicomService();