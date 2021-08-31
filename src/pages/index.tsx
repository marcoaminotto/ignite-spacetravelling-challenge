import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { FaUser, FaCalendar } from 'react-icons/fa';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<PostPagination>({
    ...postsPagination,
    results: postsPagination.results.map(post => ({
      ...post,
      first_publication_date: String(
        new Date(post.first_publication_date)
          .toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          .replace(/(de)|\./g, '')
      ),
    })),
  });

  async function fetchData(): Promise<void> {
    await fetch(posts.next_page)
      .then(response => response.json())
      .then(data => {
        const formatedDatePosts = data.results.map(post => {
          return {
            ...post,
            first_publication_date: String(
              new Date(post.first_publication_date)
                .toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
                .replace(/(de)|\./g, '')
            ),
          };
        });

        const updatedPosts = {
          results: [...posts.results, ...formatedDatePosts],
          next_page: data.next_page,
        };
        setPosts(updatedPosts);
      });
  }

  return (
    <div className={commonStyles.container}>
      <Header />
      <main className={styles.posts}>
        <div>
          {posts.results.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <div>
                    <FaCalendar />
                    <time>{post.first_publication_date}</time>
                  </div>
                  <div>
                    <FaUser />
                    <p>{post.data.author}</p>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {posts.next_page && (
          <button type="button" onClick={() => fetchData()}>
            Carregar mais posts
          </button>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 20,
    }
  );

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
