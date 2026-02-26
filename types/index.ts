export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'member';
  nickname?: string;
  location?: string;
  specialty?: string;
  created_at: string;
}

export interface Album {
  id: string;
  title: string;
  description?: string;
  cover_photo_url?: string;
  first_photo_url?: string;
  cover_photos?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  photo_count?: number;
  earliest_taken_at?: string | null;
  latest_taken_at?: string | null;
}

export interface Photo {
  id: string;
  album_id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  thumbnail_url: string;
  width: number;
  height: number;
  caption?: string;
  taken_at?: string;
  uploaded_by: string;
  uploader?: User;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  media_type?: 'image' | 'video';
  user_has_liked?: boolean;
  memory_note?: string;
}

export interface Comment {
  id: string;
  photo_id: string;
  user_id: string;
  user?: User;
  content: string;
  created_at: string;
}

export interface Like {
  id: string;
  photo_id: string;
  user_id: string;
  created_at: string;
}

export interface Invite {
  id: string;
  email: string;
  token: string;
  invited_by: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  description?: string;
  proposed_dates?: ProposedDate[];
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  confirmed_start?: string;
  confirmed_end?: string;
  cover_photo_url?: string;
  packing_list?: PackingItem[];
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  rsvps?: TripRsvp[];
}

export interface TripRsvp {
  id: string;
  trip_id: string;
  user_id: string;
  user?: User;
  status: 'going' | 'maybe' | 'not_going';
  note?: string;
}

export interface ProposedDate {
  label: string;
  start: string;
  end: string;
  votes: string[];
}

export interface PackingItem {
  item: string;
  checked: boolean;
}

export interface WallEntry {
  id: string;
  title: string;
  story: string;
  photo_id?: string;
  photo_url?: string;
  category: 'moment' | 'quote' | 'trip' | 'hostel' | 'cricket' | 'music';
  era?: string;
  submitted_by: string;
  submitter?: User;
  vote_count: number;
  is_pinned: boolean;
  user_has_voted?: boolean;
  created_at: string;
}

export interface SoundtrackSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  youtube_id?: string;
  note?: string;
  added_by?: string;
  adder?: User;
  position: number;
  is_signature: boolean;
  genre?: string;
  created_at: string;
}

export interface BoardPost {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'meetup' | 'announcement' | 'reminder' | 'joke';
  is_pinned: boolean;
  author_id: string;
  author?: User;
  comment_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BoardComment {
  id: string;
  post_id: string;
  user_id: string;
  user?: User;
  content: string;
  created_at: string;
}
