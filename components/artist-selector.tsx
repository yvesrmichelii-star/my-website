"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Music2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Artist } from "@/lib/mock-data";

interface ArtistSelectorProps {
  artists: Artist[];
  selectedArtist: Artist | null;
  onSelectArtist: (artist: Artist) => void;
  onAddArtist: (artist: Artist) => void;
}

export function ArtistSelector({
  artists,
  selectedArtist,
  onSelectArtist,
  onAddArtist,
}: ArtistSelectorProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newArtist, setNewArtist] = useState({
    name: "",
    genre: "",
    baseLocation: "",
  });

  const handleAddArtist = () => {
    if (newArtist.name && newArtist.genre && newArtist.baseLocation) {
      const artist: Artist = {
        id: `artist-${Date.now()}`,
        name: newArtist.name,
        genre: newArtist.genre,
        baseLocation: newArtist.baseLocation,
        coordinates: { lat: 34.0522, lng: -118.2437 }, // Default to LA
      };
      onAddArtist(artist);
      setNewArtist({ name: "", genre: "", baseLocation: "" });
      setDialogOpen(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[280px] justify-between bg-card"
          >
            {selectedArtist ? (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <Music2 className="h-3 w-3 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{selectedArtist.name}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                  <Users className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="font-medium">All Artists</div>
                </div>
              </div>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search artists..." />
            <CommandList>
              <CommandEmpty>No artist found.</CommandEmpty>
              <CommandGroup heading="View">
                <CommandItem
                  value="all-artists"
                  onSelect={() => {
                    onSelectArtist(null as unknown as Artist);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">All Artists</div>
                    <div className="text-xs text-muted-foreground">
                      View all requests
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selectedArtist === null ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Your Artists">
                {artists.map((artist) => (
                  <CommandItem
                    key={artist.id}
                    value={artist.name}
                    onSelect={() => {
                      onSelectArtist(artist);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Music2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{artist.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {artist.genre}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedArtist?.id === artist.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setDialogOpen(true);
                  }}
                  className="flex items-center gap-2 py-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add new artist</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Artist</DialogTitle>
            <DialogDescription>
              Add a new artist to manage their booking requests.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Artist Name</Label>
              <Input
                id="name"
                placeholder="e.g., DJ Sunset"
                value={newArtist.name}
                onChange={(e) =>
                  setNewArtist({ ...newArtist, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                placeholder="e.g., House / Techno"
                value={newArtist.genre}
                onChange={(e) =>
                  setNewArtist({ ...newArtist, genre: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Base Location</Label>
              <Input
                id="location"
                placeholder="e.g., New York, NY"
                value={newArtist.baseLocation}
                onChange={(e) =>
                  setNewArtist({ ...newArtist, baseLocation: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddArtist}
              disabled={
                !newArtist.name || !newArtist.genre || !newArtist.baseLocation
              }
            >
              Add Artist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
