package main

import (
  "encoding/json"
  "log"
  "net/http"
  "sync"
  "time"
)

type PlayerTime struct {
  Name      string     `json:"name"`
  Duration  float64    `json:"duration"`
  Time      time.Time  `json:"-"`        // DO NOT PARSE
}

type PlayerTimeStore map[string]PlayerTime;

var time_store PlayerTimeStore;

var rw_mutex sync.RWMutex;

func set_player_time(w http.ResponseWriter, r *http.Request) {
  var player_time PlayerTime;
  err := json.NewDecoder(r.Body).Decode(&player_time);
  if err != nil {
    panic(err)
  }
  log.Println(player_time.Duration);
  player_time.Time = time.Now();
  rw_mutex.Lock();
  defer rw_mutex.Unlock();
  time_store[player_time.Name] = player_time;
}

func get_player_times(w http.ResponseWriter, r *http.Request) {
  time_store_snapshot := make(map[string]PlayerTime);
  rw_mutex.RLock();
  for k, player_time_copy := range time_store {
    player_time_copy.Duration += time.Since(player_time_copy.Time).Seconds();
    time_store_snapshot[k] = player_time_copy;
  }
  rw_mutex.RUnlock();    
  w.Header().Set("Content-Type", "application/json; charset=UTF-8");
  json.NewEncoder(w).Encode(time_store_snapshot);
}

func purge_loop() {
  for {
    for k := range time_store {
      if time.Since(time_store[k].Time).Seconds() > 25 {
        rw_mutex.Lock();
        delete(time_store, k);
        rw_mutex.Unlock();
      }
    }
    time.Sleep(1);
  }
}



func main() {
  time_store = make(map[string]PlayerTime);
  go purge_loop();
  http.HandleFunc("/set_time", set_player_time);
  http.HandleFunc("/get_times", get_player_times);
  log.Fatal(http.ListenAndServe(":8080", nil));
}