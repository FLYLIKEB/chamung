import { useCallback, useEffect, useId, useState } from 'react';
import { Check, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { TeawareItem, TeawareKind } from '../types';
import { TEAWARE_PRESETS, TEAWARE_VARIANTS, getTeawareImage, teawareKey } from '../constants/teaware';
import { teawareApi } from '../lib/api/teaware.api';
import { useAuth } from '../contexts/AuthContext';
import { ImageUploader } from './ImageUploader';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';

interface TeawareSelectorProps {
  value: TeawareItem[];
  onChange: (value: TeawareItem[]) => void;
  allowLibrary?: boolean;
}

// Library responses also contain server timestamps; only store the note snapshot.
function snapshot({ id, variantId, kind, name, imageUrl }: TeawareItem): TeawareItem {
  return { ...(id != null ? { id } : {}), ...(variantId ? { variantId } : {}), kind, name, ...(imageUrl ? { imageUrl } : {}) };
}

export function TeawareSelector({ value, onChange, allowLibrary = true }: TeawareSelectorProps) {
  const { isAuthenticated, user } = useAuth();
  const inputId = useId();
  const [activeKind, setActiveKind] = useState<TeawareKind>('gaiwan');
  const [query, setQuery] = useState('');
  const [library, setLibrary] = useState<TeawareItem[]>([]);
  const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<TeawareKind>('gaiwan');
  const [photos, setPhotos] = useState<string[]>([]);
  const [removing, setRemoving] = useState<TeawareItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const canUseLibrary = allowLibrary && isAuthenticated;

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try { setLibrary((await teawareApi.getAll()).map(snapshot)); }
    catch { setLoadError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (canUseLibrary) void loadLibrary();
    else setLibrary([]);
  }, [canUseLibrary, user?.id, loadLibrary]);

  const toggle = (item: TeawareItem) => {
    const key = teawareKey(item);
    const selected = value.some(current => teawareKey(current) === key);
    if (selected) onChange(value.filter(current => teawareKey(current) !== key));
    else if (value.length < 12) onChange([...value, snapshot(item)]);
    else toast.error('다구는 최대 12개까지 선택할 수 있습니다.');
  };

  const register = async () => {
    if (!name.trim() || !photos[0]) return;
    if (value.length >= 12) { toast.error('다구는 최대 12개까지 선택할 수 있습니다.'); return; }
    setSaving(true);
    try {
      const item = snapshot(await teawareApi.create({ name: name.trim(), kind, imageUrl: photos[0] }));
      setLibrary(items => [...items, item]);
      if (value.length < 12) onChange([...value, item]);
      setAdding(false);
      setName('');
      setPhotos([]);
      toast.success('내 다구에 등록했습니다.');
    } catch { toast.error('다구를 등록하지 못했습니다. 다시 시도해 주세요.'); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (removing?.id == null) return;
    setDeleting(true);
    try {
      await teawareApi.delete(removing.id);
      setLibrary(items => items.filter(item => item.id !== removing.id));
      onChange(value.filter(item => item.id !== removing.id));
      setRemoving(null);
    } catch { toast.error('다구를 삭제하지 못했습니다. 다시 시도해 주세요.'); }
    finally { setDeleting(false); }
  };

  // Old note snapshots remain selectable even if removed from the personal library.
  const personal = [...library.map(item => value.find(selected => selected.id === item.id) ?? item), ...value.filter(item => item.id != null && !library.some(saved => saved.id === item.id))];
  const gallery = TEAWARE_VARIANTS.filter(item => item.kind === activeKind && item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const tile = (item: TeawareItem, removable = false) => {
    const selected = value.some(current => teawareKey(current) === teawareKey(item));
    const photoFailed = !!item.imageUrl && failedImageUrls.includes(item.imageUrl);
    const fallback = getTeawareImage({ ...item, imageUrl: undefined, variantId: undefined });
    return (
      <div key={teawareKey(item)} className="relative min-w-0">
        <button
          type="button"
          aria-pressed={selected}
          aria-label={item.name}
          onClick={() => toggle(item)}
          className={`relative flex min-h-28 w-full flex-col items-center justify-end gap-2 rounded-sm px-2 py-3 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${selected ? 'bg-muted text-foreground ring-1 ring-primary/60' : 'text-muted-foreground hover:bg-muted/50'}`}
        >
          <img loading="lazy" decoding="async" src={photoFailed ? fallback : getTeawareImage(item)} alt="" className={`h-16 w-20 object-contain ${item.imageUrl ? '' : '[image-rendering:pixelated]'}`} onError={event => {
            const imageUrl = item.imageUrl;
            if (imageUrl) setFailedImageUrls(urls => urls.includes(imageUrl) ? urls : [...urls, imageUrl]);
            if (event.currentTarget.getAttribute('src') !== fallback) event.currentTarget.src = fallback;
          }} />
          <span className="line-clamp-2 break-keep">{item.name}</span>
          {photoFailed && <span className="text-[11px] text-muted-foreground">사진을 불러오지 못했어요</span>}
          {selected && <Check aria-hidden="true" className="absolute left-1.5 top-1.5 h-3.5 w-3.5" />}
        </button>
        {removable && <button type="button" aria-label={`${item.name} 내 다구에서 삭제`} onClick={() => setRemoving(item)} className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
      </div>
    );
  };

  return (
    <section className="space-y-3 rounded-lg bg-card p-4" aria-label="사용한 다구 선택">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">사용한 다구</h3>
        {value.length > 0 && <button type="button" onClick={() => onChange([])} className="min-h-9 text-xs text-muted-foreground hover:text-foreground">선택 해제</button>}
      </div>
      {value.length > 0 && (
        <div className="space-y-2" aria-label="선택한 다구">
          <p className="text-xs text-muted-foreground">선택한 다구 {value.length}/12</p>
          <div className="flex flex-wrap gap-1.5">
            {value.map(item => <button key={teawareKey(item)} type="button" aria-label={`${item.name} 선택 해제`} onClick={() => toggle(item)} className="flex min-h-9 items-center gap-1.5 rounded-sm bg-muted px-2.5 py-1 text-xs text-foreground"><span>{item.name}</span><X aria-hidden="true" className="h-3 w-3 shrink-0" /></button>)}
          </div>
        </div>
      )}
      <Tabs value={activeKind} onValueChange={next => { setActiveKind(next as TeawareKind); setQuery(''); }}>
        <TabsList aria-label="다구 종류" className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {TEAWARE_PRESETS.map(category => <TabsTrigger key={category.kind} value={category.kind} aria-label={`${category.name} ${TEAWARE_VARIANTS.filter(item => item.kind === category.kind).length}종`} className="min-h-10 gap-1.5 px-2.5 text-xs data-[state=active]:underline underline-offset-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{category.name}<span className="text-[10px] text-muted-foreground">{TEAWARE_VARIANTS.filter(item => item.kind === category.kind).length}</span></TabsTrigger>)}
        </TabsList>
        <div className="mt-3"><Label className="sr-only" htmlFor={`${inputId}-search`}>다구 이름 검색</Label><Input id={`${inputId}-search`} value={query} onChange={event => setQuery(event.target.value)} placeholder="다구 이름 검색" type="search" /></div>
        <TabsContent value={activeKind} className="mt-2">
          <div className="max-h-80 overflow-y-auto overscroll-contain p-1" aria-label="기본 다구 그림">
            {gallery.length > 0 ? <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{gallery.map(item => tile(item))}</div> : <p className="py-8 text-center text-xs text-muted-foreground">찾는 다구가 없습니다.</p>}
          </div>
        </TabsContent>
      </Tabs>
      {canUseLibrary && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">내 다구</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)} className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" />내 다구 추가</Button>
          </div>
          {loading && <p role="status" className="text-xs text-muted-foreground">내 다구를 불러오고 있어요.</p>}
          {loadError && <div role="alert" className="flex items-center gap-3 text-xs text-muted-foreground"><span>내 다구를 불러오지 못했습니다.</span><button type="button" onClick={loadLibrary} className="underline underline-offset-4">다시 시도</button></div>}
          {personal.length > 0 && <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{personal.map(item => tile(item, library.some(saved => saved.id === item.id)))}</div>}
          {!loading && !loadError && personal.length === 0 && <p className="text-xs text-muted-foreground">사진으로 내 다구를 등록해 두고 사용할 수 있어요.</p>}
        </div>
      )}
      <Dialog open={adding} onOpenChange={open => { if (!saving) setAdding(open); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogTitle>내 다구 추가</DialogTitle>
          <DialogDescription>이름과 사진을 등록하면 다음 차록에서도 선택할 수 있어요.</DialogDescription>
          <div className="space-y-2"><Label htmlFor={`${inputId}-name`}>이름</Label><Input id={`${inputId}-name`} value={name} onChange={event => setName(event.target.value)} maxLength={60} placeholder="예: 백자 개완" disabled={saving} /></div>
          <div className="space-y-2"><Label htmlFor={`${inputId}-kind`}>종류</Label><select id={`${inputId}-kind`} value={kind} onChange={event => setKind(event.target.value as TeawareKind)} disabled={saving} className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm">{TEAWARE_PRESETS.map(item => <option key={item.kind} value={item.kind}>{item.name}</option>)}</select></div>
          <ImageUploader images={photos} onChange={setPhotos} maxImages={1} />
          <Button type="button" onClick={register} disabled={saving || !name.trim() || photos.length !== 1}>{saving ? <Loader2 aria-label="등록 중" className="h-4 w-4 animate-spin" /> : '등록하고 선택'}</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={!!removing} onOpenChange={open => { if (!open && !deleting) setRemoving(null); }}>
        <DialogContent>
          <DialogTitle>내 다구에서 삭제</DialogTitle>
          <DialogDescription>{removing?.name}을 내 다구에서 삭제할까요? 이전 차록에 남긴 다구는 유지됩니다.</DialogDescription>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" disabled={deleting} onClick={() => setRemoving(null)}>취소</Button><Button type="button" disabled={deleting} onClick={remove}>삭제</Button></div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
