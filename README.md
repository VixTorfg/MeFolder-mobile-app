# MeFolder Mobile App

> **Status: In Development** - Personal project in planning and initial development phase

A personal mobile library to organize and manage files intuitively on mobile devices, built with React Native and Expo.

## **Project Objectives**

MeFolder aims to solve the need for a **personal file manager** on mobile devices that is:
- **Intuitive**: Clean and easy-to-use interface
- **Organizational**: Virtual folder system, tags, and colors
- **Multimedia**: Integrated player for video, audio, and images
- **Portable**: Simple export and import via QR
- **Personal**: Private library without cloud dependencies

## **Main Features**

### **Import System**
- Import from gallery, camera, and documents
- Support for multiple file types
- Original metadata preservation

### **Smart Organization** 
- Customizable virtual folders
- Flexible tag system
- Color codes for categorization
- Advanced filters and search

### **Multimedia Player**
- Integrated video player
- Audio player with advanced controls
- Image viewer with zoom and gallery
- Document reader (PDF, text)

### **Export and Share**
- QR generation for download
- Export complete collections
- Device synchronization
- Personal library backup

## **Technology Stack**

- **Framework**: React Native + Expo (Managed Workflow)
- **Language**: TypeScript
- **Database**: SQLite (expo-sqlite)
- **Multimedia**: expo-av
- **Camera/QR**: expo-camera + expo-barcode-scanner
- **Storage**: FileSystem API + AsyncStorage

## **Project Structure**

```
src/
├── app/           # Navigation and main structure
├── screens/       # Screen components
├── components/    # Reusable components
├── hooks/         # Custom hooks
├── database/      # SQLite database and migrations
├── services/      # File management services
├── models/        # Data models
├── types/         # TypeScript definitions
├── utils/         # Helper functions
└── assets/        # Static resources
```

## **Development Roadmap**

### Phase 1: Foundations 
- [x] Initial project setup
- [x] Folder structure
- [x] TypeScript configuration
- [ ] Base navigation system

### Phase 2: Import and Storage 
- [ ] File import system
- [ ] SQLite database
- [ ] FileSystem management
- [ ] Main data models

### Phase 3: Organization 
- [ ] Create virtual folders
- [ ] Tag system
- [ ] Filters and search
- [ ] Organization interface

### Phase 4: Multimedia Player 
- [ ] Video player
- [ ] Audio player
- [ ] Image viewer
- [ ] Document reader

### Phase 5: Export 
- [ ] QR generator
- [ ] Export system
- [ ] Import via QR
- [ ] Backup and restore

## **System Requirements**
**Still to be confirmed**

- **iOS**: 13.0+
- **Android**: API Level 21+ (Android 5.0)
- **Storage**: ~50MB + space for user files
- **Permissions**: Camera, gallery, storage

## **Contributions**

This is a personal project for portfolio purposes, but suggestions and feedback are always welcome.

## **License**

MIT License - See [LICENSE](LICENSE) for more details.

---

**Developed as a personal portfolio project**
