import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';

// ─── Tipos auxiliares ────────────────────────────────────────────
type Section =
  | 'permissions'
  | 'assets'
  | 'albums'
  | 'albumDetail'
  | 'assetDetail'
  | 'create'
  | 'search';

// ─── Componente principal ────────────────────────────────────────
export default function MediaLibraryDemo() {
  const router = useRouter();

  // Estado general
  const [section, setSection] = useState<Section>('permissions');
  const [permissionStatus, setPermissionStatus] = useState<MediaLibrary.PermissionResponse | null>(null);

  // Assets
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [assetsEndCursor, setAssetsEndCursor] = useState<string | undefined>();
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalAssetCount, setTotalAssetCount] = useState(0);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaLibrary.MediaTypeValue | 'all'>('all');
  const [sortBy, setSortBy] = useState<MediaLibrary.SortByKey>(MediaLibrary.SortBy.creationTime as MediaLibrary.SortByKey);
  const [sortAsc, setSortAsc] = useState(false);

  // Albums
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<MediaLibrary.Album | null>(null);
  const [albumAssets, setAlbumAssets] = useState<MediaLibrary.Asset[]>([]);

  // Asset detail
  const [selectedAsset, setSelectedAsset] = useState<MediaLibrary.Asset | null>(null);
  const [assetInfo, setAssetInfo] = useState<MediaLibrary.AssetInfo | null>(null);

  // Create album
  const [newAlbumName, setNewAlbumName] = useState('');

  // Refresh
  const [refreshing, setRefreshing] = useState(false);

  // ─── Permisos ────────────────────────────────────────────────
  const requestPermissions = async () => {
    const perm = await MediaLibrary.requestPermissionsAsync();
    setPermissionStatus(perm);
    if (perm.granted) {
      setSection('assets');
    }
  };

  const checkPermissions = async () => {
    const perm = await MediaLibrary.getPermissionsAsync();
    setPermissionStatus(perm);
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  // ─── Cargar assets ────────────────────────────────────────────
  const loadAssets = useCallback(
    async (after?: string) => {
      setLoadingAssets(true);
      try {
        const mediaType =
          mediaTypeFilter === 'all'
            ? [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video, MediaLibrary.MediaType.audio]
            : [mediaTypeFilter];

        const options: MediaLibrary.AssetsOptions = {
          first: 20,
          mediaType,
          sortBy: [[sortBy, sortAsc] as MediaLibrary.SortByValue],
        };
        if (after) {
          options.after = after;
        }

        const result = await MediaLibrary.getAssetsAsync(options);

        if (after) {
          setAssets((prev) => [...prev, ...result.assets]);
        } else {
          setAssets(result.assets);
        }
        setAssetsEndCursor(result.endCursor);
        setHasNextPage(result.hasNextPage);
        setTotalAssetCount(result.totalCount);
      } catch (e: any) {
        Alert.alert('Error loading assets', e.message);
      }
      setLoadingAssets(false);
    },
    [mediaTypeFilter, sortBy, sortAsc]
  );

  const loadMoreAssets = () => {
    if (hasNextPage && !loadingAssets && assetsEndCursor) {
      loadAssets(assetsEndCursor);
    }
  };

  // ─── Albums ───────────────────────────────────────────────────
  const loadAlbums = async () => {
    try {
      const result = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });
      setAlbums(result);
    } catch (e: any) {
      Alert.alert('Error loading albums', e.message);
    }
  };

  const loadAlbumAssets = async (album: MediaLibrary.Album) => {
    try {
      const result = await MediaLibrary.getAssetsAsync({
        album: album.id,
        first: 50,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video, MediaLibrary.MediaType.audio],
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      setAlbumAssets(result.assets);
    } catch (e: any) {
      Alert.alert('Error loading album assets', e.message);
    }
  };

  // ─── Asset detail ─────────────────────────────────────────────
  const loadAssetInfo = async (asset: MediaLibrary.Asset) => {
    try {
      const info = await MediaLibrary.getAssetInfoAsync(asset.id) as MediaLibrary.AssetInfo;
      setAssetInfo(info);
    } catch (e: any) {
      Alert.alert('Error loading asset info', e.message);
    }
  };

  // ─── Crear album ──────────────────────────────────────────────
  const createAlbum = async () => {
    if (!newAlbumName.trim()) {
      Alert.alert('Nombre vacío', 'Escribe un nombre para el álbum');
      return;
    }
    try {
      // Necesitamos al menos un asset para crear un álbum en Android
      if (assets.length === 0) {
        Alert.alert('Sin assets', 'Primero carga assets para poder crear un álbum');
        return;
      }
      const album = await MediaLibrary.createAlbumAsync(newAlbumName.trim(), assets[0], false);
      Alert.alert('Álbum creado', `ID: ${album.id}\nTítulo: ${album.title}`);
      setNewAlbumName('');
      loadAlbums();
    } catch (e: any) {
      Alert.alert('Error creating album', e.message);
    }
  };

  // ─── Eliminar asset ───────────────────────────────────────────
  const deleteAsset = async (asset: MediaLibrary.Asset) => {
    Alert.alert('Eliminar asset', `¿Seguro que quieres eliminar "${asset.filename}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await MediaLibrary.deleteAssetsAsync([asset.id]);
            Alert.alert('Resultado', result ? 'Eliminado correctamente' : 'No se pudo eliminar');
            // Recargar
            loadAssets();
            setSection('assets');
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  // ─── Listener de cambios ──────────────────────────────────────
  useEffect(() => {
    const subscription = MediaLibrary.addListener((event: MediaLibrary.MediaLibraryAssetsChangeEvent) => {
      console.log('📸 MediaLibrary change event:', event);
    });
    return () => subscription.remove();
  }, []);

  // ─── Auto-load al cambiar sección ─────────────────────────────
  useEffect(() => {
    if (section === 'assets' && permissionStatus?.granted) {
      loadAssets();
    }
    if (section === 'albums' && permissionStatus?.granted) {
      loadAlbums();
    }
  }, [section, mediaTypeFilter, sortBy, sortAsc]);

  // ─── Refresh ──────────────────────────────────────────────────
  const onRefresh = async () => {
    setRefreshing(true);
    if (section === 'assets') await loadAssets();
    if (section === 'albums') await loadAlbums();
    setRefreshing(false);
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  // ─── Header con navegación ─────────────────────────────────────
  const renderHeader = () => (
    <View style={s.header}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backBtnText}>← Volver</Text>
      </TouchableOpacity>
      <Text style={s.headerTitle}>expo-media-library Demo</Text>
    </View>
  );

  // ─── Tabs de sección ──────────────────────────────────────────
  const renderTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar}>
      {(
        [
          ['permissions', '🔐 Permisos'],
          ['assets', '📷 Assets'],
          ['albums', '📁 Álbums'],
          ['create', '➕ Crear'],
          ['search', '🔍 Info'],
        ] as [Section, string][]
      ).map(([key, label]) => (
        <TouchableOpacity
          key={key}
          style={[s.tab, section === key && s.tabActive]}
          onPress={() => setSection(key)}
        >
          <Text style={[s.tabText, section === key && s.tabTextActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // ─── SECCIÓN: Permisos ────────────────────────────────────────
  const renderPermissions = () => (
    <ScrollView style={s.content} contentContainerStyle={s.contentInner}>
      <Text style={s.sectionTitle}>Estado de permisos</Text>

      <View style={s.infoBox}>
        <InfoRow label="granted" value={String(permissionStatus?.granted ?? '?')} />
        <InfoRow label="status" value={permissionStatus?.status ?? '?'} />
        <InfoRow label="canAskAgain" value={String(permissionStatus?.canAskAgain ?? '?')} />
        <InfoRow label="expires" value={String(permissionStatus?.expires ?? '?')} />
        {permissionStatus?.accessPrivileges && (
          <InfoRow label="accessPrivileges" value={permissionStatus.accessPrivileges} />
        )}
      </View>

      <TouchableOpacity style={s.btn} onPress={requestPermissions}>
        <Text style={s.btnText}>Solicitar permisos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={checkPermissions}>
        <Text style={[s.btnText, s.btnTextSecondary]}>Verificar permisos</Text>
      </TouchableOpacity>

      <Text style={s.note}>
        En iOS 14+ se puede otorgar acceso limitado (solo a algunas fotos).{'\n'}
        accessPrivileges será "limited" en ese caso.
      </Text>
    </ScrollView>
  );

  // ─── SECCIÓN: Assets ──────────────────────────────────────────
  const renderAssets = () => (
    <View style={{ flex: 1 }}>
      {/* Filtros */}
      <View style={s.filterBar}>
        <Text style={s.filterLabel}>Tipo:</Text>
        {(
          [
            ['all', 'Todos'],
            [MediaLibrary.MediaType.photo, 'Fotos'],
            [MediaLibrary.MediaType.video, 'Videos'],
            [MediaLibrary.MediaType.audio, 'Audio'],
          ] as [MediaLibrary.MediaTypeValue | 'all', string][]
        ).map(([value, label]) => (
          <TouchableOpacity
            key={String(value)}
            style={[s.filterChip, mediaTypeFilter === value && s.filterChipActive]}
            onPress={() => {
              setMediaTypeFilter(value);
              setAssets([]);
              setAssetsEndCursor(undefined);
            }}
          >
            <Text style={[s.filterChipText, mediaTypeFilter === value && s.filterChipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sort */}
      <View style={s.filterBar}>
        <Text style={s.filterLabel}>Ordenar:</Text>
        {(
          [
            [MediaLibrary.SortBy.creationTime, 'Creación'],
            [MediaLibrary.SortBy.modificationTime, 'Modificación'],
            [MediaLibrary.SortBy.mediaType, 'Tipo'],
            [MediaLibrary.SortBy.duration, 'Duración'],
            [MediaLibrary.SortBy.width, 'Ancho'],
            [MediaLibrary.SortBy.height, 'Alto'],
          ] as [MediaLibrary.SortByKey, string][]
        ).map(([value, label]) => (
          <TouchableOpacity
            key={value}
            style={[s.filterChip, sortBy === value && s.filterChipActive]}
            onPress={() => {
              setSortBy(value as MediaLibrary.SortByKey);
              setAssets([]);
              setAssetsEndCursor(undefined);
            }}
          >
            <Text style={[s.filterChipText, sortBy === value && s.filterChipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[s.filterChip, { backgroundColor: '#6c757d' }]}
          onPress={() => {
            setSortAsc(!sortAsc);
            setAssets([]);
            setAssetsEndCursor(undefined);
          }}
        >
          <Text style={[s.filterChipText, { color: '#fff' }]}>{sortAsc ? '↑ ASC' : '↓ DESC'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.countText}>
        Total: {totalAssetCount} | Cargados: {assets.length}
      </Text>

      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        numColumns={3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.assetThumb}
            onPress={() => {
              setSelectedAsset(item);
              loadAssetInfo(item);
              setSection('assetDetail');
            }}
          >
            {item.mediaType === 'photo' || item.mediaType === 'video' ? (
              <Image source={{ uri: item.uri }} style={s.assetImage} />
            ) : (
              <View style={[s.assetImage, s.audioPlaceholder]}>
                <Text style={{ fontSize: 28 }}>🎵</Text>
              </View>
            )}
            <Text style={s.assetType}>{item.mediaType === 'video' ? '🎬' : ''}</Text>
          </TouchableOpacity>
        )}
        onEndReached={loadMoreAssets}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingAssets ? (
            <ActivityIndicator style={{ padding: 20 }} />
          ) : hasNextPage ? (
            <TouchableOpacity style={s.loadMoreBtn} onPress={loadMoreAssets}>
              <Text style={s.loadMoreText}>Cargar más...</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          !loadingAssets ? (
            <Text style={s.emptyText}>No se encontraron assets</Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );

  // ─── SECCIÓN: Detalle de asset ────────────────────────────────
  const renderAssetDetail = () => {
    if (!selectedAsset) return null;
    const info = assetInfo;

    return (
      <ScrollView style={s.content} contentContainerStyle={s.contentInner}>
        <TouchableOpacity onPress={() => setSection('assets')} style={{ marginBottom: 12 }}>
          <Text style={{ color: '#007bff', fontSize: 16 }}>← Volver a assets</Text>
        </TouchableOpacity>

        {selectedAsset.mediaType === 'photo' || selectedAsset.mediaType === 'video' ? (
          <Image source={{ uri: selectedAsset.uri }} style={s.assetDetailImage} resizeMode="contain" />
        ) : (
          <View style={[s.assetDetailImage, s.audioPlaceholder]}>
            <Text style={{ fontSize: 60 }}>🎵</Text>
          </View>
        )}

        <Text style={s.sectionTitle}>Propiedades del Asset</Text>
        <View style={s.infoBox}>
          <InfoRow label="id" value={selectedAsset.id} />
          <InfoRow label="filename" value={selectedAsset.filename} />
          <InfoRow label="mediaType" value={selectedAsset.mediaType} />
          <InfoRow label="width" value={String(selectedAsset.width)} />
          <InfoRow label="height" value={String(selectedAsset.height)} />
          <InfoRow label="duration" value={`${selectedAsset.duration.toFixed(2)}s`} />
          <InfoRow label="creationTime" value={new Date(selectedAsset.creationTime).toLocaleString()} />
          <InfoRow label="modificationTime" value={new Date(selectedAsset.modificationTime).toLocaleString()} />
          <InfoRow label="uri" value={selectedAsset.uri} selectable />
        </View>

        {info && (
          <>
            <Text style={s.sectionTitle}>Info extendida (getAssetInfoAsync)</Text>
            <View style={s.infoBox}>
              <InfoRow label="localUri" value={info.localUri ?? 'N/A'} selectable />
              {info.location && (
                <>
                  <InfoRow label="latitude" value={String(info.location.latitude)} />
                  <InfoRow label="longitude" value={String(info.location.longitude)} />
                </>
              )}
              {info.exif && (
                <InfoRow
                  label="EXIF keys"
                  value={Object.keys(info.exif).join(', ')}
                  selectable
                />
              )}
              {info.isFavorite !== undefined && (
                <InfoRow label="isFavorite" value={String(info.isFavorite)} />
              )}
            </View>
          </>
        )}

        <TouchableOpacity style={[s.btn, { backgroundColor: '#dc3545', marginTop: 16 }]} onPress={() => deleteAsset(selectedAsset)}>
          <Text style={s.btnText}>🗑️ Eliminar este asset</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ─── SECCIÓN: Álbums ──────────────────────────────────────────
  const renderAlbums = () => {
    if (selectedAlbum) {
      return (
        <View style={{ flex: 1 }}>
          <View style={s.content}>
            <TouchableOpacity
              onPress={() => {
                setSelectedAlbum(null);
                setAlbumAssets([]);
              }}
              style={{ marginBottom: 8 }}
            >
              <Text style={{ color: '#007bff', fontSize: 16 }}>← Volver a álbums</Text>
            </TouchableOpacity>

            <Text style={s.sectionTitle}>{selectedAlbum.title}</Text>
            <View style={s.infoBox}>
              <InfoRow label="id" value={selectedAlbum.id} />
              <InfoRow label="title" value={selectedAlbum.title} />
              <InfoRow label="assetCount" value={String(selectedAlbum.assetCount)} />
              {selectedAlbum.type && <InfoRow label="type" value={selectedAlbum.type} />}
            </View>
          </View>

          <FlatList
            data={albumAssets}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.assetThumb}
                onPress={() => {
                  setSelectedAsset(item);
                  loadAssetInfo(item);
                  setSection('assetDetail');
                }}
              >
                {item.mediaType === 'photo' || item.mediaType === 'video' ? (
                  <Image source={{ uri: item.uri }} style={s.assetImage} />
                ) : (
                  <View style={[s.assetImage, s.audioPlaceholder]}>
                    <Text style={{ fontSize: 28 }}>🎵</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={s.emptyText}>Álbum vacío</Text>}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          />

          <View style={{ padding: 16 }}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: '#dc3545' }]}
              onPress={() => {
                Alert.alert('Eliminar álbum', `¿Eliminar "${selectedAlbum.title}"?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const result = await MediaLibrary.deleteAlbumsAsync([selectedAlbum], true);
                        Alert.alert('Resultado', result ? 'Eliminado' : 'No se pudo eliminar');
                        setSelectedAlbum(null);
                        loadAlbums();
                      } catch (e: any) {
                        Alert.alert('Error', e.message);
                      }
                    },
                  },
                ]);
              }}
            >
              <Text style={s.btnText}>🗑️ Eliminar álbum</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <ScrollView
        style={s.content}
        contentContainerStyle={s.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={s.sectionTitle}>Álbums ({albums.length})</Text>
        <Text style={s.note}>Incluye Smart Albums (iOS). Toca uno para ver su contenido.</Text>

        {albums.map((album) => (
          <TouchableOpacity
            key={album.id}
            style={s.albumRow}
            onPress={() => {
              setSelectedAlbum(album);
              loadAlbumAssets(album);
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.albumTitle}>{album.title}</Text>
              <Text style={s.albumMeta}>
                {album.assetCount} assets · Tipo: {album.type ?? 'N/A'}
              </Text>
            </View>
            <Text style={{ fontSize: 18 }}>→</Text>
          </TouchableOpacity>
        ))}

        {albums.length === 0 && <Text style={s.emptyText}>No se encontraron álbums</Text>}

        <TouchableOpacity style={[s.btn, s.btnSecondary, { marginTop: 16 }]} onPress={loadAlbums}>
          <Text style={[s.btnText, s.btnTextSecondary]}>🔄 Recargar álbums</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ─── SECCIÓN: Crear álbum ─────────────────────────────────────
  const renderCreate = () => (
    <ScrollView style={s.content} contentContainerStyle={s.contentInner}>
      <Text style={s.sectionTitle}>Crear nuevo álbum</Text>
      <Text style={s.note}>
        En Android se necesita al menos un asset para crear un álbum.{'\n'}
        Se usará el primer asset cargado.
      </Text>

      <TextInput
        style={s.input}
        placeholder="Nombre del álbum"
        value={newAlbumName}
        onChangeText={setNewAlbumName}
      />

      <TouchableOpacity style={s.btn} onPress={createAlbum}>
        <Text style={s.btnText}>Crear álbum</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 32 }}>
        <Text style={s.sectionTitle}>Otras operaciones</Text>

        <TouchableOpacity
          style={[s.btn, s.btnSecondary]}
          onPress={async () => {
            try {
              // presentPermissionsPickerAsync solo iOS 14+
              if (Platform.OS === 'ios') {
                await MediaLibrary.presentPermissionsPickerAsync();
                Alert.alert('Picker presentado', 'El usuario pudo cambiar la selección de fotos');
              } else {
                Alert.alert('Solo iOS', 'presentPermissionsPickerAsync solo está disponible en iOS 14+');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          }}
        >
          <Text style={[s.btnText, s.btnTextSecondary]}>📱 presentPermissionsPickerAsync (iOS)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, s.btnSecondary, { marginTop: 8 }]}
          onPress={async () => {
            try {
              const supported = await MediaLibrary.getAssetsAsync({ first: 1 });
              Alert.alert(
                'getAssetsAsync test',
                `Retornó ${supported.totalCount} assets totales.\nPrimer asset: ${supported.assets[0]?.filename ?? 'ninguno'}`
              );
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          }}
        >
          <Text style={[s.btnText, s.btnTextSecondary]}>🧪 Test getAssetsAsync (1)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, s.btnSecondary, { marginTop: 8 }]}
          onPress={async () => {
            try {
              const album = await MediaLibrary.getAlbumAsync('Camera');
              if (album) {
                Alert.alert('Álbum Camera', `ID: ${album.id}\nAssets: ${album.assetCount}`);
              } else {
                Alert.alert('No encontrado', 'No existe un álbum llamado "Camera"');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          }}
        >
          <Text style={[s.btnText, s.btnTextSecondary]}>📸 getAlbumAsync("Camera")</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ─── SECCIÓN: Info / Búsqueda ─────────────────────────────────
  const renderSearch = () => (
    <ScrollView style={s.content} contentContainerStyle={s.contentInner}>
      <Text style={s.sectionTitle}>Información de la API</Text>

      <View style={s.infoBox}>
        <InfoRow label="MediaType.photo" value={MediaLibrary.MediaType.photo} />
        <InfoRow label="MediaType.video" value={MediaLibrary.MediaType.video} />
        <InfoRow label="MediaType.audio" value={MediaLibrary.MediaType.audio} />
        <InfoRow label="MediaType.unknown" value={MediaLibrary.MediaType.unknown} />
      </View>

      <Text style={[s.sectionTitle, { marginTop: 16 }]}>SortBy opciones</Text>
      <View style={s.infoBox}>
        <InfoRow label="default" value={MediaLibrary.SortBy.default} />
        <InfoRow label="creationTime" value={MediaLibrary.SortBy.creationTime} />
        <InfoRow label="modificationTime" value={MediaLibrary.SortBy.modificationTime} />
        <InfoRow label="mediaType" value={MediaLibrary.SortBy.mediaType} />
        <InfoRow label="width" value={MediaLibrary.SortBy.width} />
        <InfoRow label="height" value={MediaLibrary.SortBy.height} />
        <InfoRow label="duration" value={MediaLibrary.SortBy.duration} />
      </View>

      <Text style={[s.sectionTitle, { marginTop: 16 }]}>Métodos disponibles</Text>
      <View style={s.infoBox}>
        {[
          'requestPermissionsAsync()',
          'getPermissionsAsync()',
          'presentPermissionsPickerAsync() [iOS]',
          'getAssetsAsync(options)',
          'getAssetInfoAsync(assetId)',
          'deleteAssetsAsync(assetIds)',
          'getAlbumsAsync(options)',
          'getAlbumAsync(title)',
          'createAlbumAsync(name, asset, copyAsset)',
          'deleteAlbumsAsync(albums, deleteAssets)',
          'addAssetsToAlbumAsync(assets, album, copy)',
          'removeAssetsFromAlbumAsync(assets, album)',
          'getMomentsAsync() [iOS]',
          'addListener(listener)',
        ].map((method, i) => (
          <Text key={i} style={s.methodItem}>
            • {method}
          </Text>
        ))}
      </View>

      <Text style={[s.sectionTitle, { marginTop: 16 }]}>Constantes disponibles</Text>
      <View style={s.infoBox}>
        <InfoRow label="Platform" value={Platform.OS} />
      </View>
    </ScrollView>
  );

  // ─── Render principal ─────────────────────────────────────────
  return (
    <View style={s.container}>
      {renderHeader()}
      {renderTabs()}
      {section === 'permissions' && renderPermissions()}
      {section === 'assets' && renderAssets()}
      {section === 'albums' && renderAlbums()}
      {section === 'albumDetail' && renderAlbums()}
      {section === 'assetDetail' && renderAssetDetail()}
      {section === 'create' && renderCreate()}
      {section === 'search' && renderSearch()}
    </View>
  );
}

// ─── Componente auxiliar ─────────────────────────────────────────
function InfoRow({ label, value, selectable }: { label: string; value: string; selectable?: boolean }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} selectable={selectable} numberOfLines={selectable ? undefined : 2}>
        {value}
      </Text>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backBtn: {
    marginRight: 12,
  },
  backBtnText: {
    fontSize: 16,
    color: '#007bff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },

  // Tabs
  tabBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    maxHeight: 48,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#6c757d',
  },
  tabTextActive: {
    color: '#007bff',
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 120,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
  },

  // Info box
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: '#868e96',
    flex: 1.5,
    textAlign: 'right',
  },

  // Buttons
  btn: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  btnTextSecondary: {
    color: '#007bff',
  },

  // Note
  note: {
    fontSize: 12,
    color: '#868e96',
    marginTop: 12,
    lineHeight: 18,
  },

  // Filter bar
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
    marginRight: 4,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
  },
  filterChipActive: {
    backgroundColor: '#007bff',
  },
  filterChipText: {
    fontSize: 12,
    color: '#495057',
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Count
  countText: {
    fontSize: 12,
    color: '#868e96',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },

  // Assets grid
  assetThumb: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 2,
    position: 'relative',
  },
  assetImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#e9ecef',
  },
  assetType: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    fontSize: 14,
  },
  audioPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dee2e6',
  },

  // Asset detail
  assetDetailImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#e9ecef',
  },

  // Albums
  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  albumMeta: {
    fontSize: 12,
    color: '#868e96',
    marginTop: 2,
  },

  // Load more
  loadMoreBtn: {
    padding: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty
  emptyText: {
    textAlign: 'center',
    color: '#868e96',
    fontSize: 14,
    marginTop: 32,
  },

  // Input
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 8,
  },

  // Methods list
  methodItem: {
    fontSize: 13,
    color: '#495057',
    paddingVertical: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
