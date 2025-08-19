import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Video } from 'expo-av';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const ExerciseInstructionsModal = ({ visible, onClose, exercise }) => {
  if (!exercise) return null;

  // Check if the video URL is a YouTube embed URL
  const isYouTubeVideo = exercise.videoUrl && exercise.videoUrl.includes('youtube.com/embed');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{exercise.name}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Video Section */}
          {exercise.videoUrl && (
            <View style={styles.videoContainer}>
              <Text style={styles.sectionTitle}>Como Executar</Text>
              <View style={styles.videoWrapper}>
                {isYouTubeVideo ? (
                  <WebView
                    source={{ uri: exercise.videoUrl }}
                    style={styles.video}
                    allowsFullscreenVideo={true}
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                  />
                ) : (
                  <Video
                    source={{ uri: exercise.videoUrl }}
                    style={styles.video}
                    useNativeControls
                    resizeMode="contain"
                    shouldPlay={false}
                  />
                )}
              </View>
            </View>
          )}

          {/* Instructions Section */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.sectionTitle}>Instruções Detalhadas</Text>
            <Text style={styles.instructionsText}>{exercise.instructions}</Text>
          </View>

          {/* Tips Section */}
          {exercise.tips && (
            <View style={styles.tipsContainer}>
              <Text style={styles.sectionTitle}>Dicas Importantes</Text>
              {exercise.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Benefits Section */}
          {exercise.benefits && (
            <View style={styles.benefitsContainer}>
              <Text style={styles.sectionTitle}>Benefícios</Text>
              {exercise.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Text style={styles.benefitBullet}>✓</Text>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B9A8B',
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  videoContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  videoWrapper: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 16/9,
    height: 200,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  instructionsContainer: {
    marginBottom: 30,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  tipsContainer: {
    marginBottom: 30,
    backgroundColor: '#FFF7E6',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  tipBullet: {
    fontSize: 16,
    color: '#FF9800',
    marginRight: 10,
    marginTop: 2,
  },
  tipText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    flex: 1,
  },
  benefitsContainer: {
    marginBottom: 30,
    backgroundColor: '#F0F8F0',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  benefitBullet: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 10,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    flex: 1,
  },
});

export default ExerciseInstructionsModal;
