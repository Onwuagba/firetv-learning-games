// Adapted from AmazonAppDev/react-native-multi-tv-app-sample (MIT-0).
import { Directions, SpatialNavigation } from "react-tv-space-navigation";
import { SupportedKeys } from "./SupportedKeys";
import RemoteControlManager from "./RemoteControlManager";

const mapping: Record<SupportedKeys, Directions | null> = {
  [SupportedKeys.Right]: Directions.RIGHT,
  [SupportedKeys.Left]: Directions.LEFT,
  [SupportedKeys.Up]: Directions.UP,
  [SupportedKeys.Down]: Directions.DOWN,
  [SupportedKeys.Enter]: Directions.ENTER,
  [SupportedKeys.Back]: null,
  [SupportedKeys.PlayPause]: null,
  [SupportedKeys.FastForward]: null,
  [SupportedKeys.Rewind]: null,
};

SpatialNavigation.configureRemoteControl({
  remoteControlSubscriber: (callback) => RemoteControlManager.addKeydownListener((k) => callback(mapping[k])),
  remoteControlUnsubscriber: (listener) => RemoteControlManager.removeKeydownListener(listener),
});
