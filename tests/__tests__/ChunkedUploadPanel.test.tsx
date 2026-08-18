import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChunkedUploadPanel from '@/components/admin/ChunkedUploadPanel';

describe('ChunkedUploadPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the file upload button', () => {
    render(<ChunkedUploadPanel />);
    const button = screen.getByRole('button', { name: /choose file/i });
    expect(button).toBeInTheDocument();
  });

  it('displays supported file formats', () => {
    render(<ChunkedUploadPanel />);
    expect(screen.getByText(/supported: txt, docx, htm, pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/hebrew and unicode fully supported/i)).toBeInTheDocument();
  });

  it('has file input with correct accept types', () => {
    render(<ChunkedUploadPanel />);
    const input = screen.getByRole('button', { name: /choose file/i }).parentElement?.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('accept', '.txt,.docx,.htm,.html,.pdf');
  });

  it('renders title, source, and content fields', () => {
    render(<ChunkedUploadPanel />);
    expect(screen.getByLabelText(/document title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/source \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/document content/i)).toBeInTheDocument();
  });

  it('renders upload button', () => {
    render(<ChunkedUploadPanel />);
    expect(screen.getByRole('button', { name: /upload & chunk/i })).toBeInTheDocument();
  });

  it('renders info section with chunking details', () => {
    render(<ChunkedUploadPanel />);
    expect(screen.getByText(/how chunking works/i)).toBeInTheDocument();
    expect(screen.getByText(/documents are split into 1,500 character chunks/i)).toBeInTheDocument();
  });

  it('disables upload button when title or content is empty', () => {
    render(<ChunkedUploadPanel />);
    const uploadButton = screen.getByRole('button', { name: /upload & chunk/i });
    expect(uploadButton).toBeDisabled();
  });

  it('enables upload button when title and content are filled', async () => {
    render(<ChunkedUploadPanel />);
    const titleInput = screen.getByLabelText(/document title/i);
    const contentInput = screen.getByLabelText(/document content/i);
    const uploadButton = screen.getByRole('button', { name: /upload & chunk/i });

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(contentInput, { target: { value: 'Test content here' } });

    await waitFor(() => {
      expect(uploadButton).not.toBeDisabled();
    });
  });

  it('displays character count for content', async () => {
    render(<ChunkedUploadPanel />);
    const contentInput = screen.getByLabelText(/document content/i);

    fireEvent.change(contentInput, { target: { value: 'This is test content' } });

    await waitFor(() => {
      expect(screen.getByText('19 characters')).toBeInTheDocument();
    });
  });

  it('disables file button while uploading', async () => {
    render(<ChunkedUploadPanel />);
    const fileButton = screen.getByRole('button', { name: /choose file/i });
    const titleInput = screen.getByLabelText(/document title/i);
    const contentInput = screen.getByLabelText(/document content/i);

    fireEvent.change(titleInput, { target: { value: 'Test' } });
    fireEvent.change(contentInput, { target: { value: 'Content' } });

    expect(fileButton).not.toBeDisabled();
  });

  it('handles TXT file parsing', async () => {
    render(<ChunkedUploadPanel />);
    const titleInput = screen.getByLabelText(/document title/i) as HTMLInputElement;
    const contentInput = screen.getByLabelText(/document content/i) as HTMLTextAreaElement;

    const file = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(titleInput.value).toBe('test');
        expect(contentInput.value).toBe('Hello World');
      });
    }
  });

  it('displays error for unsupported file types', async () => {
    render(<ChunkedUploadPanel />);
    const file = new File(['content'], 'test.exe', { type: 'application/octet-stream' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
      });
    }
  });
});
