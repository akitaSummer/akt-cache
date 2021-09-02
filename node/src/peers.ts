export interface PeerPicker {
  pickPeer(key: string):  Promise<PeerGetter> | null;
}

export interface PeerGetter {
  get(Group: string, key: string): any | Promise<any> | null;
}
