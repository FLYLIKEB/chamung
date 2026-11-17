import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeawareSelector } from '../TeawareSelector';
import { teawareApi } from '../../lib/api/teaware.api';
import type { TeawareItem } from '../../types';

vi.mock('../../lib/api/teaware.api', () => ({ teawareApi: { getAll: vi.fn(), create: vi.fn(), delete: vi.fn() } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: true, user: { id: 1 } }) }));
vi.mock('../ImageUploader', () => ({ ImageUploader: ({ onChange }: { onChange: (images: string[]) => void }) => <button type="button" onClick={() => onChange(['https://images.example.com/gaiwan.webp'])}>사진 업로드</button> }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const custom: TeawareItem = { id: 7, name: '백자 개완', kind: 'gaiwan', imageUrl: 'https://images.example.com/gaiwan.webp' };
function Harness({ initial = [] }: { initial?: TeawareItem[] }) {
  const [value, setValue] = useState(initial);
  return <><TeawareSelector value={value} onChange={setValue} /><output aria-label="선택 결과">{JSON.stringify(value)}</output></>;
}

beforeEach(() => { vi.mocked(teawareApi.getAll).mockResolvedValue([]); });

describe('TeawareSelector', () => {
  it('기본 다구 여러 개를 선택하고 모두 해제한다', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: '개완' }));
    await user.click(screen.getByRole('button', { name: '찻잔' }));
    expect(screen.getByRole('button', { name: '개완' })).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(screen.getByLabelText('선택 결과').textContent || '[]')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: '선택 해제' }));
    expect(screen.getByLabelText('선택 결과')).toHaveTextContent('[]');
  });

  it('사진과 이름을 등록하고 서버 항목을 선택하며 불필요한 서버 속성은 저장하지 않는다', async () => {
    const user = userEvent.setup();
    vi.mocked(teawareApi.create).mockResolvedValue({ ...custom, createdAt: '2026-11-18' } as TeawareItem);
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: '내 다구 추가' }));
    const submit = screen.getByRole('button', { name: '등록하고 선택' });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText('이름'), '  백자 개완  ');
    await user.click(screen.getByRole('button', { name: '사진 업로드' }));
    await user.click(submit);
    await waitFor(() => expect(teawareApi.create).toHaveBeenCalledWith({ name: '백자 개완', kind: 'gaiwan', imageUrl: custom.imageUrl }));
    expect(await screen.findByRole('button', { name: '백자 개완' })).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(screen.getByLabelText('선택 결과').textContent || '[]')).toEqual([custom]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('등록 실패 시 사진과 이름을 유지하고 선택하지 않는다', async () => {
    const user = userEvent.setup();
    vi.mocked(teawareApi.create).mockRejectedValue(new Error('offline'));
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: '내 다구 추가' }));
    await user.type(screen.getByLabelText('이름'), '백자 개완');
    await user.click(screen.getByRole('button', { name: '사진 업로드' }));
    await user.click(screen.getByRole('button', { name: '등록하고 선택' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '등록하고 선택' })).not.toBeDisabled());
    expect(screen.getByLabelText('이름')).toHaveValue('백자 개완');
    expect(screen.getByLabelText('선택 결과')).toHaveTextContent('[]');
  });

  it('라이브러리에서 사라진 차록의 다구도 복원하고 선택 해제할 수 있다', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[custom]} />);
    const item = await screen.findByRole('button', { name: '백자 개완' });
    expect(item).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: '백자 개완 내 다구에서 삭제' })).not.toBeInTheDocument();
    await user.click(item);
    expect(screen.getByLabelText('선택 결과')).toHaveTextContent('[]');
  });

  it('라이브러리 삭제 성공 후 현재 선택에서도 제거한다', async () => {
    const user = userEvent.setup();
    vi.mocked(teawareApi.getAll).mockResolvedValue([custom]);
    vi.mocked(teawareApi.delete).mockResolvedValue(undefined);
    render(<Harness initial={[custom]} />);
    await user.click(await screen.findByRole('button', { name: '백자 개완 내 다구에서 삭제' }));
    await user.click(screen.getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(teawareApi.delete).toHaveBeenCalledWith(7));
    expect(screen.queryByRole('button', { name: '백자 개완' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('선택 결과')).toHaveTextContent('[]');
  });

  it('목록 실패를 알리고 재시도 후 사진 다구를 보여 준다', async () => {
    vi.mocked(teawareApi.getAll).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([custom]);
    render(<Harness />);
    expect(await screen.findByRole('alert')).toHaveTextContent('불러오지 못했습니다');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByRole('button', { name: '백자 개완' })).toBeInTheDocument();
  });

  it('사진 실패를 표시하고 사진 주소가 바뀌면 새 사진을 다시 시도한다', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<TeawareSelector value={[custom]} onChange={onChange} />);
    const image = (await screen.findByRole('button', { name: '백자 개완' })).querySelector('img')!;
    fireEvent.error(image);
    expect(screen.getByText('사진을 불러오지 못했어요')).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/teaware/gaiwan.svg');
    const next = { ...custom, imageUrl: 'https://images.example.com/new-gaiwan.webp' };
    rerender(<TeawareSelector value={[next]} onChange={onChange} />);
    expect(screen.queryByText('사진을 불러오지 못했어요')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '백자 개완' }).querySelector('img')).toHaveAttribute('src', next.imageUrl);
  });

});
